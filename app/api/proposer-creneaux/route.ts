import { NextRequest, NextResponse } from "next/server";
import { mailRecipient } from "@/lib/mail";
import { db } from "@/lib/db";
import { interventions, clients } from "@/lib/db/schema";
import { eq, and, isNull, sql } from "drizzle-orm";
import { trouverCreneaux } from "@/lib/creneaux";
import { Resend } from "resend";
import { randomBytes, timingSafeEqual } from "crypto";
import { logError } from "@/lib/observability";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { escapeHtml } from "@/lib/escape-html";

const resend = new Resend(process.env.RESEND_API_KEY);

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Autre",
};

function secretOk(header: string | null): boolean {
  const expected = process.env.NEXTAUTH_SECRET ?? "";
  if (!expected || !header) return false;
  const a = Buffer.from(header), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Appelée UNIQUEMENT en interne par le chatbot (serveur -> serveur). Elle réécrit le rdvToken de
// l'intervention et envoie un e-mail : sans protection, une injection de prompt sur Alex (qui
// produit le corps CRENEAUX_READY) permettrait de spammer des e-mails depuis notre domaine et
// d'invalider le lien RDV du vrai client. On exige donc un secret interne, on rate-limite, et on
// N'UTILISE PAS l'e-mail/nom fournis dans le corps : on prend ceux rattachés à l'intervention en base.
export async function POST(req: NextRequest) {
  if (!secretOk(req.headers.get("x-internal-secret"))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!(await rateLimit(`proposer-creneaux:${clientIp(req)}`, 20, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Trop de demandes" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const { interventionId, typeIntervention, codePostal } = body;

  if (!interventionId) {
    return NextResponse.json({ error: "interventionId requis" }, { status: 400 });
  }

  // Intervention + client rattaché (source de vérité pour l'e-mail et le nom, PAS le corps).
  const [interv] = await db
    .select({ intervention: interventions, clientEmail: clients.email, clientName: clients.name })
    .from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .where(and(eq(interventions.id, interventionId), isNull(interventions.supprimeLe)))
    .limit(1);

  if (!interv) return NextResponse.json({ error: "intervention not found" }, { status: 404 });
  const iv = interv.intervention;
  const emailClient = (interv.clientEmail ?? "").trim();
  const nomClient = interv.clientName ?? "";
  if (!emailClient) return NextResponse.json({ error: "Ce client n'a pas d'e-mail" }, { status: 400 });

  const duree = iv.dureeEstimeeMinutes ?? 240;
  const cp = codePostal ?? iv.codePostal ?? "75001";
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
    version: sql`${interventions.version} + 1`,
    updatedAt: new Date(),
  }).where(eq(interventions.id, interventionId));

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
  const emailTo = mailRecipient(emailClient);

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

  // Best-effort : le token et les créneaux sont DÉJÀ enregistrés en base ; si Resend échoue,
  // on le dit clairement (au lieu d'un 500 brut) pour que l'expéditeur renvoie le lien.
  try {
  await resend.emails.send({
    from: "ClimExpert <noreply@climexpert.fr>",
    to: emailTo,
    subject: `Votre ${TYPE_LABELS[typeIntervention] ?? typeIntervention} Clim Expert – Choisissez votre créneau`,
    html: `
      <div style="font-family:Arial,sans-serif; max-width:600px; margin:0 auto;">
        <h2 style="color:#0f172a;">Bonjour ${escapeHtml(nomClient)},</h2>
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
  } catch (e) {
    logError("proposerCreneaux.email", e, { interventionId });
    return NextResponse.json({
      ok: false,
      rdvToken,
      error: `Les créneaux sont réservés mais l'e-mail n'a pas pu être envoyé à ${emailTo}. Renvoyez le lien ${baseUrl}/rdv/${rdvToken} manuellement.`,
    }, { status: 502 });
  }

  return NextResponse.json({
    ok: true,
    rdvToken,
    creneaux: creneaux.map((c) => c.label),
    message: `Email envoyé à ${emailTo} avec 3 créneaux.`,
  });
}
