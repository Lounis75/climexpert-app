import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { suivisPlanifies, clients, interventions } from "@/lib/db/schema";
import { eq, and, lte, isNull } from "drizzle-orm";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Intervention",
};

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Fetch due email suivis (j7 and j30)
  const dueSuivis = await db
    .select({
      suivi: suivisPlanifies,
      clientEmail: clients.email,
      clientName: clients.name,
      clientToken: clients.clientToken,
      interventionType: interventions.type,
    })
    .from(suivisPlanifies)
    .leftJoin(clients, eq(suivisPlanifies.clientId, clients.id))
    .leftJoin(interventions, eq(suivisPlanifies.interventionId, interventions.id))
    .where(
      and(
        eq(suivisPlanifies.canal, "email"),
        eq(suivisPlanifies.statut, "planifie"),
        lte(suivisPlanifies.datePrevue, today),
        isNull(interventions.supprimeLe),
      ),
    );

  let sent = 0;
  const errors: string[] = [];
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";

  for (const row of dueSuivis) {
    const { suivi, clientEmail, clientName, clientToken, interventionType } = row;
    if (!clientEmail) continue;

    const typeLabel = TYPE_LABELS[interventionType ?? ""] ?? "Intervention";
    const portalLink = clientToken ? `${baseUrl}/suivi/${clientToken}` : null;

    const isJ7   = suivi.typeSuivi === "j7";
    const isJ30  = suivi.typeSuivi === "j30";

    const subject = isJ7
      ? `Comment s'est passée votre ${typeLabel} ? — Clim Expert`
      : `Pensez à l'entretien annuel — Clim Expert`;

    const html = isJ7
      ? `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0f172a;">Bonjour ${clientName ?? ""},</h2>
          <p>Votre ${typeLabel} a été réalisée il y a une semaine. Tout fonctionne bien ?</p>
          <p>Si vous avez la moindre question ou constatez un problème, nous sommes disponibles.</p>
          ${portalLink ? `<p><a href="${portalLink}" style="color:#0ea5e9;">Accéder à votre espace client</a></p>` : ""}
          <p style="color:#94a3b8;font-size:12px;">L'équipe Clim Expert</p>
        </div>
      `
      : isJ30
      ? `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <h2 style="color:#0f172a;">Bonjour ${clientName ?? ""},</h2>
          <p>Votre ${typeLabel} date d'un mois. Tout se passe bien avec votre installation ?</p>
          <p>Pour maintenir les performances de votre équipement, pensez à planifier un entretien annuel.</p>
          ${portalLink ? `<p><a href="${portalLink}" style="background:#0ea5e9;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Voir mon espace client</a></p>` : ""}
          <p style="color:#94a3b8;font-size:12px;">L'équipe Clim Expert</p>
        </div>
      `
      : null;

    if (!html) continue;

    try {
      await resend.emails.send({
        from: "ClimExpert <noreply@climexpert.fr>",
        to: process.env.EMAIL_TEST_OVERRIDE || clientEmail,
        subject,
        html,
      });
      await db.update(suivisPlanifies).set({
        statut: "envoye",
        dateEnvoi: new Date(),
      }).where(eq(suivisPlanifies.id, suivi.id));
      sent++;
    } catch (err) {
      errors.push(`${suivi.id}: ${String(err)}`);
    }
  }

  return NextResponse.json({ ok: true, sent, errors });
}
