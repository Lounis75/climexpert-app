import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, suivis, notifications } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createClientFromLead } from "@/lib/clients";
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
  const [lead] = await db.select().from(leads).where(eq(leads.devisToken, token)).limit(1);
  if (!lead) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  if (lead.devisDecision) {
    return NextResponse.json({ ok: true, already: true, decision: lead.devisDecision });
  }

  const motifClean = decision === "refuse" ? (String(motif ?? "").slice(0, 500).trim() || "Non précisé") : null;
  const newStatus = decision === "accepte" ? "gagné" : "perdu";
  const montantTxt = lead.montantDevisCt ? ` (${(lead.montantDevisCt / 100).toLocaleString("fr-FR")} €)` : "";

  await db.update(leads).set({
    devisDecision: decision,
    devisDecisionLe: new Date(),
    devisMotifRefus: motifClean,
    status: newStatus,
    ...(decision === "accepte" ? { gagneLe: new Date() } : {}),
    statutChangeLe: new Date(), relanceNotifieeLe: null,
    version: sql`${leads.version} + 1`, updatedAt: new Date(),
  }).where(eq(leads.id, lead.id));

  // Accepté -> conversion auto en client (idempotent), comme un passage "gagné" classique.
  if (decision === "accepte") {
    try { await createClientFromLead(lead.id); }
    catch (e) { logError("devisDecision.conversion", e, { leadId: lead.id }); }
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
