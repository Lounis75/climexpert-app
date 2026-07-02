import { db } from "@/lib/db";
import { leads, suivis, devisEnvois } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { mailRecipient } from "@/lib/mail";
import { generateDevisNumber } from "@/lib/devis";
import { computeDevisLignes, clientAddressLine, renderDevisPdf, type RawLine } from "@/lib/devis-pdf";
import { r2PutFile } from "@/lib/r2";
import { resolveLeadId } from "@/lib/chiffrage-server";
import type { ChiffrageClient } from "@/lib/catalogue";
import { escapeHtml } from "@/lib/escape-html";
import { logError } from "@/lib/observability";

export type SendDevisParams = {
  leadId?: string;
  clientId?: string | null;
  clientType?: "particulier" | "pro" | string;
  client?: Record<string, string>;
  lignes: RawLine[];
  description?: string | null;
  project?: string | null;
  message?: string;
};

export type SendDevisResult =
  | { ok: true; leadId: string; montantCt: number; number: string }
  | { ok: false; status: number; error: string };

// Génère le PDF du devis, le stocke sur R2, l'envoie au client par e-mail (avec lien de décision)
// et bascule le prospect en "devis_envoyé". Source unique partagée par l'envoi direct depuis le
// chiffrage et la validation par un expert.
export async function sendChiffrageDevis(params: SendDevisParams): Promise<SendDevisResult> {
  const client = params.client ?? {};
  const rawLines: RawLine[] = Array.isArray(params.lignes) ? params.lignes : [];
  const message = String(params.message ?? "").trim();
  const clientType = params.clientType === "pro" ? "pro" : "particulier";
  if (rawLines.length === 0) return { ok: false, status: 400, error: "Aucune ligne de devis." };

  // 1) Prospect (existant ou créé), e-mail requis
  const { id } = await resolveLeadId(params.leadId, client as unknown as ChiffrageClient, clientType, { clientId: params.clientId, project: params.project ?? undefined });
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return { ok: false, status: 404, error: "Prospect introuvable" };
  const email = (lead.email || client.email || "").trim();
  if (!email) return { ok: false, status: 400, error: "Renseigne l'e-mail du client pour pouvoir lui envoyer le devis." };

  // 2) Lignes + totaux
  const { lignes, totalHtCt, totalTtcCt } = computeDevisLignes(rawLines, clientType);
  const montantCt = totalTtcCt;
  const clientAddress = clientAddressLine(client) || lead.address || lead.location || null;
  const description = String(params.description ?? "").trim() || null;

  // 3) PDF
  let buf: Buffer;
  let number: string;
  try {
    number = await generateDevisNumber();
    const created = new Date();
    const valid = new Date(created.getTime() + 30 * 86400000);
    buf = await renderDevisPdf({
      number, createdAt: created.toISOString(), validUntil: valid.toISOString(),
      clientName: lead.name, clientAddress, description, lignes, totalHtCt, totalTtcCt,
    });
  } catch (e) {
    logError("devis-send.pdf", e, { leadId: id });
    return { ok: false, status: 500, error: "Échec de la génération du PDF." };
  }

  // 4) R2
  const key = `devis/${id}-${randomBytes(6).toString("hex")}.pdf`;
  let url: string;
  try { url = await r2PutFile(key, buf, "application/pdf"); }
  catch (e) { logError("devis-send.r2", e, { leadId: id }); return { ok: false, status: 500, error: "Échec du stockage du PDF." }; }

  // 5) Enregistrement durable (token) avant l'e-mail
  const token = randomBytes(32).toString("hex");
  try {
    await db.insert(devisEnvois).values({ leadId: id, url, nomFichier: `${number}.pdf`, token, montantCt, envoyeLe: new Date() });
  } catch (e) {
    logError("devis-send.insert", e, { leadId: id });
    return { ok: false, status: 500, error: "Échec de l'enregistrement du devis." };
  }

  // 6) E-mail avec lien de décision
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
  const link = `${baseUrl}/mon-devis/${token}`;
  const montantTxt = `${(montantCt / 100).toLocaleString("fr-FR")} €`;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: mailRecipient(email),
      subject: "Votre devis ClimExpert",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#0f172a;">Bonjour ${escapeHtml(lead.name)},</h2>
        <p>Suite à notre échange, vous trouverez ci-joint votre <strong>devis</strong> d'un montant de <strong>${montantTxt}</strong>.</p>
        ${message ? `<p>${escapeHtml(message).replace(/\n/g, "<br>")}</p>` : ""}
        <p>Pour <strong>valider</strong> ou <strong>décliner</strong> votre devis, c'est en 1 clic :</p>
        <p><a href="${link}" style="background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Voir mon devis et répondre</a></p>
        <p style="color:#64748b;font-size:12px;">Lien personnel, merci de ne pas le transférer.</p>
        <p style="color:#94a3b8;font-size:12px;">L'équipe ClimExpert<br>contact@climexpert.fr</p>
      </div>`,
      attachments: [{ filename: `${number}.pdf`, content: buf }],
    });
  } catch (e) {
    logError("devis-send.email", e, { leadId: id });
    // L'e-mail n'est jamais parti : on invalide le lien créé à l'étape 5, sinon un envoi
    // « fantôme » resterait décidable 60 jours et gonflerait l'historique du prospect.
    await db.delete(devisEnvois).where(eq(devisEnvois.token, token)).catch((e2) => logError("devis-send.cleanup", e2, { leadId: id }));
    return { ok: false, status: 500, error: "Échec de l'envoi de l'e-mail au client." };
  }

  // 7) Bascule du prospect en "devis_envoyé" + nettoyage du brouillon
  await db.update(leads).set({
    devisUrl: url, devisNomFichier: `${number}.pdf`, devisEnvoyeLe: new Date(), devisToken: token,
    devisDecision: null, devisDecisionLe: null, devisMotifRefus: null,
    montantDevisCt: montantCt, status: "devis_envoyé", statutChangeLe: new Date(), relanceNotifieeLe: null,
    chiffrageBrouillon: null,
    ...(!lead.email && email ? { email } : {}),
    version: sql`${leads.version} + 1`, updatedAt: new Date(),
  }).where(eq(leads.id, id));

  await db.insert(suivis).values({ leadId: id, type: "devis", contenu: `Devis envoyé au client (${montantTxt}).` }).catch((e) => logError("devis-send.suivi", e, { leadId: id }));

  return { ok: true, leadId: id, montantCt, number };
}
