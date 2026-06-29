import { NextRequest, NextResponse } from "next/server";
import { getInterventions, createIntervention } from "@/lib/interventions";
import { getClientById } from "@/lib/clients";
import { Resend } from "resend";
import { mailRecipient } from "@/lib/mail";
import { escapeHtml } from "@/lib/escape-html";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien", depannage: "Dépannage", "contrat-pro": "Entretien", autre: "Intervention",
};

// Envoi best-effort d'un e-mail de confirmation au client quand une intervention est planifiée.
async function envoiConfirmationIntervention(clientId: string, type: string, start: Date, dureeMin: number, address: string | null) {
  try {
    const client = await getClientById(clientId);
    const email = (client?.email || "").trim();
    if (!email) return;
    const end = new Date(start.getTime() + Math.max(30, dureeMin) * 60000);
    const jour = start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
    const h1 = start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const h2 = end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    const lieu = (address || client?.address || "").trim();
    const prenom = (client?.name || "").trim().split(" ")[0] || "";
    const label = TYPE_LABELS[type] ?? "Intervention";
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: mailRecipient(email),
      subject: `Confirmation de votre intervention, le ${jour}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
        <h2 style="color:#0284c7;">Votre intervention est planifiée</h2>
        <p>Bonjour${prenom ? ` ${escapeHtml(prenom)}` : ""},</p>
        <p>Nous vous confirmons votre intervention avec <strong>ClimExpert</strong> :</p>
        <table style="border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:6px 12px 6px 0;color:#64748b;">Prestation</td><td style="padding:6px 0;font-weight:bold;">${escapeHtml(label)}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#64748b;">Date</td><td style="padding:6px 0;font-weight:bold;">${jour}</td></tr>
          <tr><td style="padding:6px 12px 6px 0;color:#64748b;">Horaire</td><td style="padding:6px 0;font-weight:bold;">${h1} – ${h2}</td></tr>
          ${lieu ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b;">Adresse</td><td style="padding:6px 0;font-weight:bold;">${escapeHtml(lieu)}</td></tr>` : ""}
        </table>
        <p>Pour toute question ou empêchement, contactez-nous au <strong>06 67 43 27 67</strong> ou répondez à cet e-mail.</p>
        <p>À très bientôt,<br>L'équipe ClimExpert</p>
        <p style="color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:8px;margin-top:16px;">CLIM EXPERT &middot; 200 rue de la Croix Nivert, 75015 Paris &middot; contact@climexpert.fr</p>
      </div>`,
    });
  } catch (e) {
    logError("intervention.confirmation.email", e, { clientId });
  }
}

export async function GET() {
  try {
    return NextResponse.json({ interventions: await getInterventions() });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, type, scheduledAt, technicienId, devisId, address, notes, sousContrat, dureeEstimeeMinutes, chantierId, siteNom, siteAdresse } = body;
    if (!clientId || !type || !scheduledAt) {
      return NextResponse.json({ error: "clientId, type et scheduledAt requis" }, { status: 400 });
    }
    const parsedDate = new Date(scheduledAt);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json({ error: `Date invalide: "${scheduledAt}"` }, { status: 400 });
    }
    const duree = Number(dureeEstimeeMinutes);
    const i = await createIntervention({
      clientId,
      type,
      scheduledAt: parsedDate,
      dureeEstimeeMinutes: Number.isFinite(duree) && duree > 0 ? Math.round(duree) : 120,
      technicienId: technicienId || null,
      devisId: devisId || null,
      address: address || null,
      notes: notes || null,
      sousContrat: typeof sousContrat === "boolean" ? sousContrat : null,
      chantierId: chantierId || null,
      siteNom: siteNom || null,
      siteAdresse: siteAdresse || null,
      status: "planifiée",
    });
    // Confirmation au client (best-effort : ne bloque pas la planification si l'e-mail échoue).
    await envoiConfirmationIntervention(clientId, type, parsedDate, Number.isFinite(duree) && duree > 0 ? Math.round(duree) : 120, address || null);
    return NextResponse.json({ intervention: i }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/admin/interventions]", err);
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
