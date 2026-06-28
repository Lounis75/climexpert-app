import { NextRequest, NextResponse } from "next/server";
import { mailRecipient } from "@/lib/mail";
import { db } from "@/lib/db";
import { interventions, clients, documents } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { r2PutFile } from "@/lib/r2";
import { logError } from "@/lib/observability";
import { RIB } from "@/lib/rib";

export const runtime = "nodejs";

// Envoi de la facture (PDF fait sur le logiciel compta) au client après l'intervention :
// stockage R2 + e-mail (PDF joint + RIB) + dépôt sur la fiche client (documents -> portail).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [interv] = await db.select().from(interventions).where(eq(interventions.id, id)).limit(1);
  if (!interv) return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });
  const [client] = await db.select().from(clients).where(eq(clients.id, interv.clientId)).limit(1);
  if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
  if (!client.email) return NextResponse.json({ error: "Ce client n'a pas d'adresse e-mail." }, { status: 400 });

  const form = await req.formData();
  const file = form.get("file");
  const message = String(form.get("message") ?? "").trim();
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "La facture doit être un fichier PDF." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "PDF trop lourd (10 Mo maximum)." }, { status: 400 });

  // 1) Stockage du PDF
  const buf = Buffer.from(await file.arrayBuffer());
  const key = `factures/${id}-${randomBytes(6).toString("hex")}.pdf`;
  let url: string;
  try { url = await r2PutFile(key, buf, "application/pdf"); }
  catch (e) { logError("facture.r2", e, { interventionId: id }); return NextResponse.json({ error: "Échec du stockage du fichier." }, { status: 500 }); }

  // 2) E-mail au client : facture jointe + RIB pour le règlement par virement
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
    const portal = client.clientToken ? `${baseUrl}/suivi/${client.clientToken}` : null;
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: mailRecipient(client.email),
      subject: "Votre facture ClimExpert",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#0f172a;">Bonjour ${client.name},</h2>
        <p>Vous trouverez ci-joint votre <strong>facture</strong> suite à notre intervention. Merci de votre confiance.</p>
        ${message ? `<p>${message.replace(/\n/g, "<br>")}</p>` : ""}
        <div style="background:#f1f5f9;border-radius:8px;padding:14px 16px;margin:18px 0;">
          <p style="margin:0 0 8px;font-weight:bold;color:#0f172a;">Règlement par virement bancaire</p>
          <p style="margin:0;color:#334155;font-size:14px;line-height:1.7;">
            Titulaire : <strong>${RIB.titulaire}</strong><br>
            IBAN : <strong>${RIB.iban}</strong><br>
            BIC : <strong>${RIB.bic}</strong>
          </p>
        </div>
        ${portal ? `<p>Vous retrouvez aussi cette facture sur votre espace client :</p>
        <p><a href="${portal}" style="background:#0ea5e9;color:white;padding:11px 22px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Accéder à mon espace</a></p>` : ""}
        <p style="color:#94a3b8;font-size:12px;">L'équipe ClimExpert<br>contact@climexpert.fr</p>
      </div>`,
      attachments: [{ filename: file.name || "facture.pdf", content: buf }],
    });
  } catch (e) {
    logError("facture.email", e, { interventionId: id });
    return NextResponse.json({ error: "Échec de l'envoi de l'e-mail au client." }, { status: 500 });
  }

  // 3) Dépôt sur la fiche client (documents -> visible sur le portail) + marquage intervention
  await db.insert(documents).values({
    clientId: client.id, interventionId: id, type: "facture",
    label: `Facture, ${new Date().toLocaleDateString("fr-FR")}`, url,
  }).catch((e) => logError("facture.document", e, { interventionId: id }));
  await db.update(interventions).set({
    factureUrl: url,
    factureEnvoyeeLe: new Date(),
    version: sql`${interventions.version} + 1`,
    updatedAt: new Date(),
  }).where(eq(interventions.id, id));

  return NextResponse.json({ ok: true });
}
