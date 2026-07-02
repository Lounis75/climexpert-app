import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, suivis, notifications, devisEnvois } from "@/lib/db/schema";
import { eq, sql, and, isNull } from "drizzle-orm";
import { createClientFromLead } from "@/lib/clients";
import { createIntervention } from "@/lib/interventions";
import { Resend } from "resend";
import { escapeHtml } from "@/lib/escape-html";
import { clientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

// Route PUBLIQUE : le client accepte ou décline son devis via le token reçu par e-mail.
// Aucune session. Met à jour le prospect, l'historique, notifie le gérant (cloche + e-mail).
export async function POST(req: NextRequest) {
  const { token, decision, motif } = await req.json().catch(() => ({}));
  if (!token || (decision !== "accepte" && decision !== "refuse")) {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }
  // Résolution du token : d'abord l'historique des devis (plusieurs liens peuvent coexister),
  // sinon l'ancien champ du prospect (devis envoyés avant la mise en place de l'historique).
  const [envoi] = await db.select().from(devisEnvois).where(eq(devisEnvois.token, token)).limit(1);
  const [lead] = envoi
    ? await db.select().from(leads).where(eq(leads.id, envoi.leadId)).limit(1)
    : await db.select().from(leads).where(eq(leads.devisToken, token)).limit(1);
  if (!lead) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });

  const dejaDecide = envoi ? envoi.decision : lead.devisDecision;
  if (dejaDecide) {
    return NextResponse.json({ ok: true, already: true, decision: dejaDecide });
  }

  // Garde-fou : un vieux lien de devis (plusieurs mois) ne doit pas réveiller le prospect.
  const sentAt = envoi?.envoyeLe ?? lead.devisEnvoyeLe;
  if (sentAt && Date.now() - new Date(sentAt).getTime() > 60 * 86400000) {
    return NextResponse.json({ error: "Ce devis a expiré. Contactez-nous pour un devis à jour." }, { status: 410 });
  }

  const motifClean = decision === "refuse" ? (String(motif ?? "").slice(0, 500).trim() || "Non précisé") : null;
  const estDevisCourant = lead.devisToken === token; // ce lien est-il le « devis courant » du prospect ?
  // « Déjà gagné » = ce prospect avait DÉJÀ été remporté par un devis précédent (gagneLe posé).
  // On se base là-dessus (et non sur clientId) : un « Nouveau devis » vers un client existant crée
  // un lead avec clientId MAIS jamais gagné → il doit quand même générer l'intervention à la signature.
  const dejaGagne = !!lead.gagneLe;
  const montantCt = envoi?.montantCt ?? lead.montantDevisCt;
  const montantTxt = montantCt ? ` (${(montantCt / 100).toLocaleString("fr-FR")} €)` : "";

  // ── Réservation ATOMIQUE de la décision (anti double-clic / double onglet / renvoi réseau) ──
  // Seule la requête qui passe réellement « decision IS NULL » -> valeur exécute les effets de bord.
  // Preuve du « bon pour accord » en ligne : IP du client capturée au moment du clic « J'accepte ».
  const acceptIp = decision === "accepte" ? clientIp(req) : null;
  let claimed: boolean;
  if (envoi) {
    const upd = await db.update(devisEnvois)
      .set({ decision, decisionLe: new Date(), motifRefus: motifClean, accepteIp: acceptIp })
      .where(and(eq(devisEnvois.id, envoi.id), isNull(devisEnvois.decision)))
      .returning({ id: devisEnvois.id });
    claimed = upd.length > 0;
  } else {
    const upd = await db.update(leads)
      .set({ devisDecision: decision, devisDecisionLe: new Date(), devisMotifRefus: motifClean })
      .where(and(eq(leads.id, lead.id), isNull(leads.devisDecision)))
      .returning({ id: leads.id });
    claimed = upd.length > 0;
  }
  if (!claimed) {
    return NextResponse.json({ ok: true, already: true, decision });
  }

  // ── Effets de bord (garantis une seule fois grâce à la réservation ci-dessus) ──
  if (decision === "accepte") {
    await db.update(leads).set({
      ...(estDevisCourant ? { devisDecision: "accepte", devisDecisionLe: new Date(), devisMotifRefus: null } : {}),
      status: "gagné", gagneLe: new Date(),
      installPrevuLe: null, // le créneau provisoire devient la vraie intervention ci-dessous
      statutChangeLe: new Date(), relanceNotifieeLe: null,
      version: sql`${leads.version} + 1`, updatedAt: new Date(),
    }).where(eq(leads.id, lead.id));
    // Conversion auto en client (idempotente). Intervention créée UNIQUEMENT à la 1re conversion
    // (évite une 2e intervention si un autre devis avait déjà fait gagner le prospect).
    try {
      const client = await createClientFromLead(lead.id);
      if (client && !dejaGagne) {
        // Si un créneau d'installation provisoire avait été posé (devis envoyé), l'intervention en hérite.
        await createIntervention({
          clientId: client.id,
          type: (lead.project ?? "autre"),
          status: "planifiée",
          scheduledAt: lead.installPrevuLe ?? null,
          address: lead.address ?? client.address ?? null,
          dureeEstimeeMinutes: lead.installPrevuDureeMin ?? 120,
        });
      }
    } catch (e) { logError("devisDecision.conversion", e, { leadId: lead.id }); }
  } else if (estDevisCourant) {
    await db.update(leads).set({
      devisDecision: "refuse", devisDecisionLe: new Date(), devisMotifRefus: motifClean,
      status: "perdu", statutChangeLe: new Date(), relanceNotifieeLe: null,
      version: sql`${leads.version} + 1`, updatedAt: new Date(),
    }).where(eq(leads.id, lead.id));
  }

  // Historique du prospect
  await db.insert(suivis).values({
    leadId: lead.id, type: "devis",
    contenu: decision === "accepte"
      ? "✅ Devis ACCEPTÉ par le client."
      : `❌ Devis décliné par le client. Motif : ${motifClean}.`,
  }).catch((e) => logError("devisDecision.suivi", e, { leadId: lead.id }));

  // Notification cloche (admin) : adminId null = visible par les admins (cf. notifs terrain).
  await db.insert(notifications).values({
    type: decision === "accepte" ? "devis_accepte" : "devis_refuse",
    titre: decision === "accepte" ? `Devis accepté, ${lead.name}` : `Devis décliné, ${lead.name}`,
    contenu: decision === "accepte"
      ? `${lead.name} a accepté son devis${montantTxt}. Passé en « gagné », fiche client créée.`
      : `${lead.name} a décliné son devis${montantTxt}. Motif : ${motifClean}.`,
    refType: "lead", refId: lead.id,
  }).catch((e) => logError("devisDecision.notif", e, { leadId: lead.id }));

  // E-mail au gérant (au cas où il n'est pas connecté à ce moment-là)
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const adminEmail = process.env.ADMIN_NOTIF_EMAIL || "contact@climexpert.fr";
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: adminEmail,
      subject: decision === "accepte" ? `✅ Devis accepté, ${lead.name}` : `❌ Devis décliné, ${lead.name}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#0f172a;">${decision === "accepte" ? "Bonne nouvelle, un devis accepté !" : "Un devis a été décliné"}</h2>
        <p><strong>${escapeHtml(lead.name)}</strong>${montantTxt}<br>${escapeHtml(lead.phone)}${lead.email ? ` &middot; ${escapeHtml(lead.email)}` : ""}</p>
        ${decision === "accepte"
          ? "<p>Le prospect est passé en « gagné » et la fiche client a été créée. Pense à planifier l'intervention.</p>"
          : `<p>Motif indiqué : <strong>${escapeHtml(motifClean)}</strong>. Tu peux le rappeler pour comprendre ou renégocier.</p>`}
        <p style="color:#94a3b8;font-size:12px;">Notification automatique ClimExpert</p>
      </div>`,
    });
  } catch (e) { logError("devisDecision.email", e, { leadId: lead.id }); }

  return NextResponse.json({ ok: true, decision });
}
