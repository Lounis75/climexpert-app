import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, suivis, notifications, devisEnvois } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createClientFromLead } from "@/lib/clients";
import { createIntervention } from "@/lib/interventions";
import { Resend } from "resend";
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

  const motifClean = decision === "refuse" ? (String(motif ?? "").slice(0, 500).trim() || "Non précisé") : null;
  const estDevisCourant = lead.devisToken === token; // ce lien est-il le « devis courant » du prospect ?
  const montantCt = envoi?.montantCt ?? lead.montantDevisCt;
  const montantTxt = montantCt ? ` (${(montantCt / 100).toLocaleString("fr-FR")} €)` : "";

  // Décision enregistrée sur la ligne d'historique (le devis concerné)
  if (envoi) {
    await db.update(devisEnvois).set({ decision, decisionLe: new Date(), motifRefus: motifClean }).where(eq(devisEnvois.id, envoi.id));
  }

  // Prospect : sur acceptation -> « gagné » (toujours). Sur refus -> « perdu » seulement si c'est
  // le devis courant (un autre devis du prospect peut encore être en attente de réponse).
  if (decision === "accepte") {
    await db.update(leads).set({
      ...(estDevisCourant ? { devisDecision: "accepte", devisDecisionLe: new Date(), devisMotifRefus: null } : {}),
      status: "gagné", gagneLe: new Date(),
      statutChangeLe: new Date(), relanceNotifieeLe: null,
      version: sql`${leads.version} + 1`, updatedAt: new Date(),
    }).where(eq(leads.id, lead.id));
    // conversion auto en client (idempotent) + intervention à planifier
    try {
      const client = await createClientFromLead(lead.id);
      if (client) {
        await createIntervention({
          clientId: client.id,
          type: (lead.project ?? "autre"),
          status: "planifiée",
          scheduledAt: null,
          address: lead.address ?? client.address ?? null,
          dureeEstimeeMinutes: 120,
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
  }).catch(() => {});

  // Notification cloche (admin) — adminId null = visible par les admins (cf. notifs terrain).
  await db.insert(notifications).values({
    type: decision === "accepte" ? "devis_accepte" : "devis_refuse",
    titre: decision === "accepte" ? `Devis accepté, ${lead.name}` : `Devis décliné, ${lead.name}`,
    contenu: decision === "accepte"
      ? `${lead.name} a accepté son devis${montantTxt}. Passé en « gagné », fiche client créée.`
      : `${lead.name} a décliné son devis${montantTxt}. Motif : ${motifClean}.`,
    refType: "lead", refId: lead.id,
  }).catch(() => {});

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
        <p><strong>${lead.name}</strong>${montantTxt}<br>${lead.phone}${lead.email ? ` &middot; ${lead.email}` : ""}</p>
        ${decision === "accepte"
          ? "<p>Le prospect est passé en « gagné » et la fiche client a été créée. Pense à planifier l'intervention.</p>"
          : `<p>Motif indiqué : <strong>${motifClean}</strong>. Tu peux le rappeler pour comprendre ou renégocier.</p>`}
        <p style="color:#94a3b8;font-size:12px;">Notification automatique ClimExpert</p>
      </div>`,
    });
  } catch (e) { logError("devisDecision.email", e, { leadId: lead.id }); }

  return NextResponse.json({ ok: true, decision });
}
