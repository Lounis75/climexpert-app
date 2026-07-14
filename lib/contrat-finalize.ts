// Construction de ContratData (depuis un contrat + son client) et finalisation du contrat
// signé : génère le PDF (gérant pré-signé + signature client), le stocke sur R2, l'ajoute aux
// documents de la fiche client et l'envoie par e-mail. Réutilisé par la route document (admin)
// et par la clôture terrain (rapport technicien).

import { generateContratPDF, type ContratData } from "@/lib/contrat-pdf";
import { todayParisISO, formatDateLongParis } from "@/lib/paris-time";
import { mailRecipient } from "@/lib/mail";
import { entretienPrix } from "@/lib/contrat-pricing";
import { r2PutFile } from "@/lib/r2";
import { db } from "@/lib/db";
import { documents, contratsEntretien, clients } from "@/lib/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { Resend } from "resend";
import { logError } from "@/lib/observability";
import { eq, type InferSelectModel } from "drizzle-orm";

type Contrat = InferSelectModel<typeof contratsEntretien>;
type Client = InferSelectModel<typeof clients>;

export function buildContratData(contrat: Contrat, client: Client, opts?: { clientSignatureDataUrl?: string }): ContratData {
  // Un contrat = entretien AVEC contrat. Le prix dépend du type de client (TVA 10/20) :
  // particulier 181,82 € HT (200 TTC), pro 182 € HT (218,40 TTC). Recalculé ici pour être
  // juste même sur les anciens contrats (la colonne prix stocke la référence particulier).
  const prix = entretienPrix({
    withContract: true,
    pro: client.typeClient === "professionnel",
    units: contrat.units,
    unitsExterieures: contrat.unitsExterieures,
  });
  return {
    clientType: client.typeClient === "professionnel" ? "professionnel" : "particulier",
    contract: {
      number: contrat.numero ?? undefined,
      date: todayParisISO(), // date de signature = aujourd'hui (jour civil PARIS, le serveur est en UTC)
      place: "Paris",
      startDate: contrat.startDate,
      visitsPerYear: 1,
    },
    client: {
      title: client.civilite ?? undefined,
      name: client.name,
      address: client.address ?? undefined,
      postalCodeCity: client.city ?? undefined,
      phone: client.phone,
      email: client.email ?? undefined,
      legalForm: client.formeJuridique ?? undefined,
      siret: client.siret ?? undefined,
      representative: client.representant ?? undefined,
      representativeRole: client.representantQualite ?? undefined,
    },
    equipment: {
      brand: contrat.marque ?? client.marqueModele ?? undefined,
      fluid: contrat.fluide ?? undefined,
      indoorCount: contrat.units,
      // Unité extérieure détaillée + résumé des unités intérieures (même marque).
      units: [
        { type: "Unité extérieure (groupe)", model: contrat.marque ?? undefined, powerKw: contrat.puissanceKw ?? undefined, serial: contrat.numeroSerie ?? undefined, location: "Extérieur", fluid: contrat.fluide ?? undefined },
        { type: contrat.units > 1 ? `${contrat.units} unités intérieures` : "Unité intérieure", model: contrat.marque ?? undefined, location: "Intérieur", fluid: contrat.fluide ?? undefined },
      ],
    },
    finance: { ht: prix.htCt / 100, vatRate: prix.vatRate },
    clientSignatureDataUrl: opts?.clientSignatureDataUrl,
  };
}

// Génère le PDF du contrat signé, le stocke (R2 + documents de la fiche client) et l'envoie
// par e-mail au client. Ne jette pas si l'e-mail échoue.
export async function finalizeContrat(opts: {
  contrat: Contrat;
  client: Client;
  clientSignatureDataUrl?: string;
}): Promise<{ url: string }> {
  const data = buildContratData(opts.contrat, opts.client, { clientSignatureDataUrl: opts.clientSignatureDataUrl });
  const pdf = await generateContratPDF(data);
  const key = `contrats/${opts.contrat.id}-${createId()}.pdf`;
  const url = await r2PutFile(key, pdf, "application/pdf");

  const dateLabel = formatDateLongParis();
  await db.insert(documents).values({
    clientId: opts.client.id,
    type: "contrat",
    label: `Contrat d'entretien ${opts.contrat.numero ?? ""}, ${dateLabel}`.replace(/\s+/g, " ").trim(),
    url,
  });

  // Mémorise la dernière version signée sur le contrat -> servie par le bouton "Contrat PDF".
  await db.update(contratsEntretien).set({ pdfSigneUrl: url }).where(eq(contratsEntretien.id, opts.contrat.id));

  if (opts.client.email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
      const portalBtn = opts.client.clientToken
        ? `<p>Retrouvez à tout moment vos documents, interventions et factures sur votre espace client :</p>
<p><a href="${baseUrl}/suivi/${opts.client.clientToken}" style="background:#0ea5e9;color:white;padding:11px 22px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Accéder à mon espace client</a></p>`
        : "";
      await resend.emails.send({
        from: "ClimExpert <noreply@climexpert.fr>",
        to: mailRecipient(opts.client.email),
        subject: "Votre contrat d'entretien, ClimExpert",
        html: `<p>Bonjour ${opts.client.name},</p>
<p>Merci de votre confiance. Vous trouverez ci-joint votre <strong>contrat d'entretien annuel</strong>, signé.</p>
<p>Nous vous recontacterons avant chaque visite pour convenir d'un rendez-vous.</p>
${portalBtn}
<p>L'équipe ClimExpert<br>contact@climexpert.fr</p>`,
        attachments: [{ filename: "contrat-entretien.pdf", content: Buffer.from(pdf) }],
      });
    } catch (e) {
      logError("contrat.email", e, { contratId: opts.contrat.id });
    }
  }

  return { url };
}
