// Finalisation du CERFA : génère le PDF officiel rempli, le stocke sur R2, l'ajoute
// aux documents de la fiche client, et l'envoie par e-mail au client.

import { generateCerfaPDF, type CerfaData } from "@/lib/cerfa-pdf";
import { mailRecipient } from "@/lib/mail";
import { r2PutFile } from "@/lib/r2";
import { db } from "@/lib/db";
import { documents, rapportsIntervention, interventions, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { createId } from "@paralleldrive/cuid2";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/escape-html";
import { logError } from "@/lib/observability";

export async function finalizeCerfa(opts: {
  clientId: string | null;
  interventionId: string;
  clientName: string;
  clientEmail?: string | null;
  cerfa: CerfaData;
}): Promise<{ url: string }> {
  const pdf = await generateCerfaPDF(opts.cerfa);
  const key = `cerfa/${opts.interventionId}-${createId()}.pdf`;
  const url = await r2PutFile(key, pdf, "application/pdf");

  const dateLabel = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  await db.insert(documents).values({
    clientId: opts.clientId,
    interventionId: opts.interventionId,
    type: "cerfa",
    label: `Attestation d'entretien (CERFA), ${dateLabel}`,
    url,
  });

  // E-mail au client avec le PDF en pièce jointe.
  if (opts.clientEmail) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "ClimExpert <noreply@climexpert.fr>",
        to: mailRecipient(opts.clientEmail),
        subject: "Votre attestation d'entretien (CERFA), ClimExpert",
        html: `<p>Bonjour ${opts.clientName},</p>
<p>Suite à notre passage, veuillez trouver ci-joint votre <strong>fiche d'intervention (CERFA 15497*04)</strong>.</p>
<p>Conservez ce document : il atteste de l'entretien réglementaire de votre installation de climatisation / pompe à chaleur.</p>
<p>L'équipe ClimExpert<br>contact@climexpert.fr</p>`,
        attachments: [{ filename: "attestation-entretien-cerfa.pdf", content: Buffer.from(pdf) }],
      });
    } catch (e) {
      logError("cerfa.email", e, { interventionId: opts.interventionId });
    }
  }

  return { url };
}

// Client absent à la clôture : on envoie un lien pour signer l'attestation à distance. On stocke le
// CERFA (gérant déjà pré-signé) sur le rapport, on génère un jeton, et on e-maile le lien au client.
export async function requestCerfaSignature(opts: {
  rapportId: string; cerfa: CerfaData; clientName: string; clientEmail?: string | null;
}): Promise<{ ok: boolean; token?: string; reason?: "no_email" | "failed" }> {
  const email = (opts.clientEmail || "").trim();
  if (!email) return { ok: false, reason: "no_email" };
  const token = randomBytes(24).toString("hex");
  try {
    await db.update(rapportsIntervention).set({
      cerfaData: opts.cerfa, cerfaSignatureToken: token, cerfaSignatureDemandeeLe: new Date(),
      cerfaClientSigneLe: null, cerfaSignatureIp: null,
    }).where(eq(rapportsIntervention.id, opts.rapportId));
  } catch (e) { logError("cerfa.request.update", e, { rapportId: opts.rapportId }); return { ok: false, reason: "failed" }; }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
  const link = `${baseUrl}/attestation/${token}`;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: mailRecipient(email),
      subject: "Votre attestation d'entretien à signer, ClimExpert",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
        <p>Bonjour ${escapeHtml(opts.clientName)},</p>
        <p>Suite à notre passage, il ne reste plus qu'à <strong>signer votre attestation d'entretien</strong> (fiche CERFA). C'est rapide et 100 % en ligne :</p>
        <p><a href="${link}" style="background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Lire et signer mon attestation</a></p>
        <p style="color:#64748b;font-size:12px;">Lien personnel, merci de ne pas le transférer.</p>
        <p style="color:#94a3b8;font-size:12px;">L'équipe ClimExpert &middot; contact@climexpert.fr</p>
      </div>`,
    });
  } catch (e) { logError("cerfa.request.email", e, { rapportId: opts.rapportId }); return { ok: false, reason: "failed" }; }
  return { ok: true, token };
}

// Récupère le rapport (et le client) rattaché à un jeton de signature CERFA.
export async function getCerfaSignatureContext(token: string) {
  const [rap] = await db.select().from(rapportsIntervention).where(eq(rapportsIntervention.cerfaSignatureToken, token)).limit(1);
  if (!rap || !rap.cerfaData) return null;
  const [iv] = await db.select().from(interventions).where(eq(interventions.id, rap.interventionId)).limit(1);
  const [cli] = iv ? await db.select().from(clients).where(eq(clients.id, iv.clientId)).limit(1) : [undefined];
  return { rapport: rap, intervention: iv ?? null, client: cli ?? null };
}

// Finalise l'attestation après signature à distance du client (appose sa signature + génère le PDF).
export async function finalizeCerfaFromSignature(token: string, clientSignatureDataUrl: string, ip?: string | null): Promise<{ ok: boolean; reason?: string }> {
  const ctx = await getCerfaSignatureContext(token);
  if (!ctx) return { ok: false, reason: "not_found" };
  if (ctx.rapport.cerfaClientSigneLe) return { ok: false, reason: "already_signed" };
  const cerfa = ctx.rapport.cerfaData as CerfaData;
  const withSig: CerfaData = {
    ...cerfa,
    signataireDetenteur: { ...(cerfa.signataireDetenteur ?? { nom: ctx.client?.name ?? "", qualite: "Client", date: "" }), signatureDataUrl: clientSignatureDataUrl },
  };
  const { url } = await finalizeCerfa({
    clientId: ctx.intervention?.clientId ?? null,
    interventionId: ctx.rapport.interventionId,
    clientName: ctx.client?.name ?? "Client",
    clientEmail: ctx.client?.email,
    cerfa: withSig,
  });
  await db.update(rapportsIntervention).set({
    cerfaClientSigneLe: new Date(), cerfaSignatureIp: ip ?? null, cerfaAttestationUrl: url,
  }).where(eq(rapportsIntervention.id, ctx.rapport.id));
  return { ok: true };
}
