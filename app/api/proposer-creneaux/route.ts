import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interventions, clients } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { trouverCreneaux } from "@/lib/creneaux";
import { Resend } from "resend";
import { randomBytes } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Autre",
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { interventionId, emailClient, nomClient, typeIntervention, codePostal } = body;

  if (!interventionId || !emailClient) {
    return NextResponse.json({ error: "interventionId et emailClient requis" }, { status: 400 });
  }

  const [interv] = await db
    .select()
    .from(interventions)
    .where(and(eq(interventions.id, interventionId), isNull(interventions.supprimeLe)))
    .limit(1);

  if (!interv) return NextResponse.json({ error: "intervention not found" }, { status: 404 });

  const duree = interv.dureeEstimeeMinutes ?? 240;
  const cp = codePostal ?? interv.codePostal ?? "75001";
  const creneaux = await trouverCreneaux(cp, duree, 3);

  if (creneaux.length === 0) {
    return NextResponse.json({ ok: false, message: "Aucun créneau disponible dans les 14 jours ouvrés." });
  }

  // Stocker les créneaux + générer rdvToken
  const rdvToken = randomBytes(32).toString("hex");
  await db.update(interventions).set({
    rdvToken,
    rdvTokenCreneaux: JSON.stringify(creneaux.map((c) => ({
      debut:         c.debut.toISOString(),
      fin:           c.fin.toISOString(),
      label:         c.label,
      technicienId:  c.technicienId,
    }))),
    updatedAt: new Date(),
  }).where(eq(interventions.id, interventionId));

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
  const emailTo = process.env.EMAIL_TEST_OVERRIDE || emailClient;

  const creneauxHtml = creneaux
    .map((c, i) => `
      <div style="margin:12px 0; padding:16px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
        <p style="margin:0 0 8px; font-weight:600; color:#0f172a;">${c.label}</p>
        <a href="${baseUrl}/rdv/${rdvToken}?choix=${i + 1}"
           style="display:inline-block; background:#0ea5e9; color:white; padding:10px 20px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
          Choisir ce créneau
        </a>
      </div>
    `).join("");

  await resend.emails.send({
    from: "ClimExpert <noreply@climexpert.fr>",
    to: emailTo,
    subject: `Votre ${TYPE_LABELS[typeIntervention] ?? typeIntervention} Clim Expert – Choisissez votre créneau`,
    html: `
      <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto;">
        <h2 style="color:#0f172a;">Bonjour ${nomClient},</h2>
        <p>Votre devis a été accepté. Voici 3 créneaux disponibles pour votre <strong>${TYPE_LABELS[typeIntervention] ?? typeIntervention}</strong> :</p>
        ${creneauxHtml}
        <p style="color:#64748b; font-size:13px; margin-top:24px;">
          Vous pouvez également voir tous les créneaux sur cette page :<br>
          <a href="${baseUrl}/rdv/${rdvToken}">${baseUrl}/rdv/${rdvToken}</a>
        </p>
        <p style="color:#94a3b8; font-size:12px;">L'équipe Clim Expert</p>
      </div>
    `,
  });

  return NextResponse.json({
    ok: true,
    rdvToken,
    creneaux: creneaux.map((c) => c.label),
    message: `Email envoyé à ${emailTo} avec 3 créneaux.`,
  });
}
