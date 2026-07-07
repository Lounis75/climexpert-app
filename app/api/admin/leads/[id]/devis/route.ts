import { NextRequest, NextResponse } from "next/server";
import { mailRecipient } from "@/lib/mail";
import { db } from "@/lib/db";
import { leads, suivis, devisEnvois } from "@/lib/db/schema";
import { eq, sql, desc, and, isNull, ne } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { r2PutFile } from "@/lib/r2";
import { createLead } from "@/lib/leads";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

// Historique des devis envoyés à ce prospect (plusieurs liens peuvent coexister).
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db.select().from(devisEnvois).where(eq(devisEnvois.leadId, id)).orderBy(desc(devisEnvois.envoyeLe));
  return NextResponse.json({ devis: rows });
}

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

  // Le prospect est DÉJÀ GAGNÉ : un nouveau devis = une NOUVELLE affaire. On la porte par un
  // nouveau prospect (clone des coordonnées) au lieu d'écraser le statut « gagné » et le montant
  // de l'affaire déjà remportée (sinon le CA de la 1re signature était effacé).
  let targetId = id;
  let spunOff = false;
  if (lead.gagneLe) {
    const fresh = await createLead({
      name: lead.name, phone: lead.phone, email: lead.email,
      address: lead.address ?? undefined, location: lead.location ?? undefined,
      source: "autre", project: lead.project ?? undefined,
      typeClient: lead.typeClient, clientId: lead.clientId ?? undefined,
      entreprise: lead.entreprise ?? undefined, siren: lead.siren ?? undefined,
    });
    targetId = fresh.id;
    spunOff = true;
  }

  // 1) Stockage du PDF sur R2
  const buf = Buffer.from(await file.arrayBuffer());
  const key = `devis/${targetId}-${randomBytes(6).toString("hex")}.pdf`;
  let url: string;
  try {
    url = await r2PutFile(key, buf, "application/pdf");
  } catch (e) {
    logError("devis.r2", e, { leadId: targetId });
    return NextResponse.json({ error: "Échec du stockage du fichier." }, { status: 500 });
  }

  // 2) Enregistrement DURABLE du devis (token) AVANT l'e-mail : le lien envoyé reste toujours
  //    adossé à un enregistrement (sinon un 2e devis pourrait « tuer » le lien du 1er). Erreur propagée.
  const token = randomBytes(32).toString("hex");
  try {
    await db.insert(devisEnvois).values({ leadId: targetId, url, nomFichier: file.name || "devis.pdf", token, montantCt: montantCt ?? null, envoyeLe: new Date() });
  } catch (e) {
    logError("devis.envoi.insert", e, { leadId: targetId });
    return NextResponse.json({ error: "Échec de l'enregistrement du devis." }, { status: 500 });
  }

  // Ce nouveau devis REMPLACE les précédents : on invalide les liens de décision encore ouverts de
  // ce prospect (sinon le client pourrait accepter une ANCIENNE version, au mauvais montant, via un
  // e-mail précédent). Marqués « annule » -> la page de décision affiche « remplacé ».
  try {
    await db.update(devisEnvois)
      .set({ decision: "annule", decisionLe: new Date() })
      .where(and(eq(devisEnvois.leadId, targetId), isNull(devisEnvois.decision), ne(devisEnvois.token, token)));
  } catch (e) { logError("devis.envoi.supersede", e, { leadId: targetId }); }

  // 3) Lien public de décision + e-mail au client (PDF joint)
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
  const link = `${baseUrl}/mon-devis/${token}`;
  const montantTxt = montantCt ? `${(montantCt / 100).toLocaleString("fr-FR")} €` : "";
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: mailRecipient(lead.email),
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
    logError("devis.email", e, { leadId: targetId });
    return NextResponse.json({ error: "Échec de l'envoi de l'e-mail au client." }, { status: 500 });
  }

  // 4) Tout est OK -> on enregistre l'état "devis envoyé" sur le prospect
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
  }).where(eq(leads.id, targetId));

  await db.insert(suivis).values({
    leadId: targetId, type: "devis",
    contenu: `Devis envoyé au client${montantTxt ? ` (${montantTxt})` : ""}, en attente de sa réponse.`,
  }).catch(() => {});

  // spunOff : un nouveau prospect a été créé pour cette 2e affaire (le gagné d'origine est préservé).
  return NextResponse.json({ ok: true, ...(spunOff ? { newLeadId: targetId } : {}) });
}
