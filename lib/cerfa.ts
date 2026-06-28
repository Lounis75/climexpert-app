// Finalisation du CERFA : génère le PDF officiel rempli, le stocke sur R2, l'ajoute
// aux documents de la fiche client, et l'envoie par e-mail au client.

import { generateCerfaPDF, type CerfaData } from "@/lib/cerfa-pdf";
import { mailRecipient } from "@/lib/mail";
import { r2PutFile } from "@/lib/r2";
import { db } from "@/lib/db";
import { documents } from "@/lib/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { Resend } from "resend";
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
