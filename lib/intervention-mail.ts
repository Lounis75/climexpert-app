import { Resend } from "resend";
import { getClientById } from "@/lib/clients";
import { mailRecipient } from "@/lib/mail";
import { escapeHtml } from "@/lib/escape-html";
import { logError } from "@/lib/observability";

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien", depannage: "Dépannage",
  depose: "Dépose", "contrat-pro": "Entretien", autre: "Intervention",
};

// Envoi de l'e-mail de confirmation d'intervention au client (prestation, date, horaire, adresse).
// Utilisé en auto à la planification ET en manuel (bouton sur la fiche). Ne jette jamais : renvoie
// un résultat (no_email = pas d'e-mail client, send_failed = échec d'envoi).
export async function sendInterventionConfirmation(opts: {
  clientId: string; type: string; start: Date; dureeMin: number; address?: string | null;
}): Promise<{ ok: boolean; reason?: "no_email" | "send_failed" }> {
  try {
    const client = await getClientById(opts.clientId);
    const email = (client?.email || "").trim();
    if (!email) return { ok: false, reason: "no_email" };

    const end = new Date(opts.start.getTime() + Math.max(30, opts.dureeMin) * 60000);
    // Fuseau forcé : le serveur (Vercel) tourne en UTC ; sans timeZone l'heure serait décalée de 2h.
    const jour = opts.start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
    const h1 = opts.start.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
    const h2 = end.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
    const lieu = (opts.address || client?.address || "").trim();
    const prenom = (client?.name || "").trim().split(" ")[0] || "";
    const label = TYPE_LABELS[opts.type] ?? "Intervention";

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
    return { ok: true };
  } catch (e) {
    logError("intervention.confirmation.email", e, { clientId: opts.clientId });
    return { ok: false, reason: "send_failed" };
  }
}
