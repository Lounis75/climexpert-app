import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, suivis } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { r2PutFile } from "@/lib/r2";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

// Envoi d'un devis (fait sur un logiciel tiers) au prospect : on stocke le PDF, on l'envoie
// par e-mail avec un lien de décision (Accepter / Décliner), et on passe le prospect en
// "devis_envoyé". La décision du client est ensuite enregistrée via /api/devis-decision.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  if (!lead.email) {
    return NextResponse.json({ error: "Ce prospect n'a pas d'adresse e-mail. Ajoute-la d'abord dans la fiche." }, { status: 400 });
  }

  const form = await req.formData();
  const file = form.get("file");
  const montantRaw = String(form.get("montant") ?? "").replace(",", ".");
  const message = String(form.get("message") ?? "").trim();
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "Le devis doit être un fichier PDF." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "PDF trop lourd (10 Mo maximum)." }, { status: 400 });

  const montant = parseFloat(montantRaw);
  const montantCt = Number.isFinite(montant) && montant > 0 ? Math.round(montant * 100) : null;

  // 1) Stockage du PDF sur R2
  const buf = Buffer.from(await file.arrayBuffer());
  const key = `devis/${id}-${randomBytes(6).toString("hex")}.pdf`;
  let url: string;
  try {
    url = await r2PutFile(key, buf, "application/pdf");
  } catch (e) {
    logError("devis.r2", e, { leadId: id });
    return NextResponse.json({ error: "Échec du stockage du fichier." }, { status: 500 });
  }

  // 2) Lien public de décision + e-mail au client (PDF joint)
  const token = randomBytes(32).toString("hex");
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
  const link = `${baseUrl}/mon-devis/${token}`;
  const montantTxt = montantCt ? `${(montantCt / 100).toLocaleString("fr-FR")} €` : "";
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: process.env.EMAIL_TEST_OVERRIDE || lead.email,
      subject: "Votre devis ClimExpert",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#0f172a;">Bonjour ${lead.name},</h2>
        <p>Suite à notre échange, vous trouverez ci-joint votre <strong>devis</strong>${montantTxt ? ` d'un montant de <strong>${montantTxt}</strong>` : ""}.</p>
        ${message ? `<p>${message.replace(/\n/g, "<br>")}</p>` : ""}
        <p>Pour <strong>valider</strong> ou <strong>décliner</strong> votre devis, c'est en 1 clic :</p>
        <p><a href="${link}" style="background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Voir mon devis et répondre</a></p>
        <p style="color:#64748b;font-size:12px;">Lien personnel, merci de ne pas le transférer.</p>
        <p style="color:#94a3b8;font-size:12px;">L'équipe ClimExpert<br>contact@climexpert.fr</p>
      </div>`,
      attachments: [{ filename: file.name || "devis.pdf", content: buf }],
    });
  } catch (e) {
    logError("devis.email", e, { leadId: id });
    return NextResponse.json({ error: "Échec de l'envoi de l'e-mail au client." }, { status: 500 });
  }

  // 3) Tout est OK -> on enregistre l'état "devis envoyé" sur le prospect
  await db.update(leads).set({
    devisUrl: url,
    devisNomFichier: file.name || "devis.pdf",
    devisEnvoyeLe: new Date(),
    devisToken: token,
    devisDecision: null, devisDecisionLe: null, devisMotifRefus: null,
    ...(montantCt !== null ? { montantDevisCt: montantCt } : {}),
    status: "devis_envoyé",
    statutChangeLe: new Date(), relanceNotifieeLe: null,
    version: sql`${leads.version} + 1`, updatedAt: new Date(),
  }).where(eq(leads.id, id));

  await db.insert(suivis).values({
    leadId: id, type: "devis",
    contenu: `Devis envoyé au client${montantTxt ? ` (${montantTxt})` : ""}, en attente de sa réponse.`,
  }).catch(() => {});

  return NextResponse.json({ ok: true });
}
