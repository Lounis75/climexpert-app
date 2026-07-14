import { db } from "@/lib/db";
import { contratsEntretien, clients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { mailRecipient } from "@/lib/mail";
import { escapeHtml } from "@/lib/escape-html";
import { logError } from "@/lib/observability";
import { entretienAffichage } from "@/lib/contrat-pricing";

// Demande de SIGNATURE À DISTANCE d'un contrat d'entretien : on génère un lien personnel et on
// l'envoie au client. Il signe depuis son téléphone, le PDF est finalisé et déposé sur sa fiche.
//
// Extrait ici pour être appelé depuis DEUX endroits :
//  - l'admin (page Contrats),
//  - le TECHNICIEN sur le terrain, à la clôture de l'intervention, quand le client accepte le
//    contrat mais n'est pas là pour signer (ou ne veut pas signer sur la tablette).
export async function demanderSignatureContrat(contratId: string): Promise<
  { ok: true; token: string } | { ok: false; reason: "introuvable" | "deja_signe" | "no_email" | "echec_email" }
> {
  const [row] = await db
    .select({ contrat: contratsEntretien, client: clients })
    .from(contratsEntretien)
    .leftJoin(clients, eq(contratsEntretien.clientId, clients.id))
    .where(eq(contratsEntretien.id, contratId))
    .limit(1);

  if (!row || !row.client) return { ok: false, reason: "introuvable" };
  if (row.contrat.signeLe) return { ok: false, reason: "deja_signe" };
  const email = (row.client.email ?? "").trim();
  if (!email) return { ok: false, reason: "no_email" };

  const token = randomBytes(32).toString("hex");
  await db.update(contratsEntretien)
    .set({ signatureToken: token, signatureDemandeeLe: new Date() })
    .where(eq(contratsEntretien.id, contratId));

  // Le montant annoncé dans l'e-mail suit la grille réelle du contrat (unités intérieures ET
  // groupes extérieurs) et la base du client : une entreprise raisonne en HT.
  const pro = row.client.typeClient === "professionnel";
  const a = entretienAffichage({
    withContract: true,
    pro,
    units: row.contrat.units,
    unitsExterieures: row.contrat.unitsExterieures,
  });

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
  const link = `${baseUrl}/contrat/signature/${token}`;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: mailRecipient(email),
      subject: "Votre contrat d'entretien à signer, ClimExpert",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
        <h2 style="color:#0f172a;">Bonjour ${escapeHtml(row.client.name)},</h2>
        <p>Votre <strong>contrat d'entretien annuel</strong> est prêt, pour un montant de <strong>${a.montant.toLocaleString("fr-FR")} € ${a.base}/an</strong>. Il ne vous reste qu'à le signer en ligne, en 2 minutes, depuis votre téléphone ou votre ordinateur.</p>
        <p><a href="${link}" style="background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Lire et signer mon contrat</a></p>
        <p style="color:#64748b;font-size:12px;">Lien personnel, merci de ne pas le transférer. Une fois signé, le contrat vous est renvoyé automatiquement et déposé sur votre espace client.</p>
        <p style="color:#94a3b8;font-size:12px;">L'équipe ClimExpert &middot; contact@climexpert.fr</p>
      </div>`,
    });
  } catch (e) {
    logError("contrat.signature.email", e, { contratId });
    return { ok: false, reason: "echec_email" };
  }
  return { ok: true, token };
}
