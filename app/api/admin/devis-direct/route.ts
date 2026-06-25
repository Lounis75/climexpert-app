import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, clients, suivis, devisEnvois } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { r2PutFile } from "@/lib/r2";
import { createLead } from "@/lib/leads";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

const PROJECTS = ["installation", "entretien", "depannage", "contrat-pro", "autre"];

// « Nouveau devis » : crée un prospect lié à un CLIENT existant (clientId) OU à un NOUVEAU
// contact saisi, puis envoie le devis (PDF) avec le lien de décision. À l'acceptation, le
// flux /api/devis-decision crée l'intervention. Miroir du devis prospect, point d'entrée unique.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const clientId = String(form.get("clientId") ?? "").trim();
  const file = form.get("file");
  const montantRaw = String(form.get("montant") ?? "").replace(",", ".");
  const message = String(form.get("message") ?? "").trim();
  const projectRaw = String(form.get("project") ?? "").trim();
  const project = (PROJECTS.includes(projectRaw) ? projectRaw : undefined) as Parameters<typeof createLead>[0]["project"];

  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  if (file.type !== "application/pdf") return NextResponse.json({ error: "Le devis doit être un fichier PDF." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "PDF trop lourd (10 Mo maximum)." }, { status: 400 });

  const montant = parseFloat(montantRaw);
  const montantCt = Number.isFinite(montant) && montant > 0 ? Math.round(montant * 100) : null;

  // Cible : client existant OU nouveau contact
  let leadData: Parameters<typeof createLead>[0];
  let clientEmail = "";
  let clientName = "";
  if (clientId) {
    const [client] = await db.select().from(clients).where(eq(clients.id, clientId)).limit(1);
    if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    if (!client.email) return NextResponse.json({ error: "Ce client n'a pas d'adresse e-mail. Ajoute-la d'abord sur sa fiche." }, { status: 400 });
    clientEmail = client.email; clientName = client.name;
    leadData = { name: client.name, phone: client.phone, email: client.email, address: client.address ?? undefined, location: client.city ?? undefined, source: "autre", project, typeClient: client.typeClient as "particulier" | "professionnel" | "sous_traitance", clientId: client.id };
  } else {
    const name = String(form.get("name") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    if (!name || !phone) return NextResponse.json({ error: "Nom et téléphone requis pour un nouveau contact." }, { status: 400 });
    if (!email) return NextResponse.json({ error: "Un e-mail est requis pour envoyer le devis." }, { status: 400 });
    clientEmail = email; clientName = name;
    leadData = { name, phone, email, address: String(form.get("address") ?? "").trim() || undefined, location: String(form.get("location") ?? "").trim() || undefined, source: "autre", project, typeClient: "particulier" };
  }

  // 1) Crée le prospect porteur du devis
  const lead = await createLead(leadData);

  // 2) Stockage R2 + e-mail (lien de décision) + statut "devis_envoyé"
  const buf = Buffer.from(await file.arrayBuffer());
  const key = `devis/${lead.id}-${randomBytes(6).toString("hex")}.pdf`;
  let url: string;
  try { url = await r2PutFile(key, buf, "application/pdf"); }
  catch (e) { logError("devisDirect.r2", e, { leadId: lead.id }); return NextResponse.json({ error: "Échec du stockage du fichier." }, { status: 500 }); }

  const token = randomBytes(32).toString("hex");
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
  const link = `${baseUrl}/mon-devis/${token}`;
  const montantTxt = montantCt ? `${(montantCt / 100).toLocaleString("fr-FR")} €` : "";
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: process.env.EMAIL_TEST_OVERRIDE || clientEmail,
      subject: "Votre devis ClimExpert",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#0f172a;">Bonjour ${clientName},</h2>
        <p>Suite à notre échange, vous trouverez ci-joint votre <strong>devis</strong>${montantTxt ? ` d'un montant de <strong>${montantTxt}</strong>` : ""}.</p>
        ${message ? `<p>${message.replace(/\n/g, "<br>")}</p>` : ""}
        <p>Pour <strong>valider</strong> ou <strong>décliner</strong> votre devis, c'est en 1 clic :</p>
        <p><a href="${link}" style="background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Voir mon devis et répondre</a></p>
        <p style="color:#94a3b8;font-size:12px;">L'équipe ClimExpert<br>contact@climexpert.fr</p>
      </div>`,
      attachments: [{ filename: file.name || "devis.pdf", content: buf }],
    });
  } catch (e) { logError("devisDirect.email", e, { leadId: lead.id }); return NextResponse.json({ error: "Échec de l'envoi de l'e-mail au client." }, { status: 500 }); }

  await db.update(leads).set({
    devisUrl: url, devisNomFichier: file.name || "devis.pdf", devisEnvoyeLe: new Date(), devisToken: token,
    ...(montantCt !== null ? { montantDevisCt: montantCt } : {}),
    status: "devis_envoyé", statutChangeLe: new Date(), relanceNotifieeLe: null,
    version: sql`${leads.version} + 1`, updatedAt: new Date(),
  }).where(eq(leads.id, lead.id));
  await db.insert(devisEnvois).values({ leadId: lead.id, url, nomFichier: file.name || "devis.pdf", token, montantCt: montantCt ?? null, envoyeLe: new Date() }).catch((e) => logError("devisDirect.envoi.insert", e, { leadId: lead.id }));
  await db.insert(suivis).values({ leadId: lead.id, type: "devis", contenu: `Devis envoyé au client${montantTxt ? ` (${montantTxt})` : ""}, en attente de sa réponse.` }).catch(() => {});

  return NextResponse.json({ ok: true, leadId: lead.id });
}
