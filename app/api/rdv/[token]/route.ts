import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interventions, clients, notifications, admins, techniciens } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { Resend } from "resend";
import { createId } from "@paralleldrive/cuid2";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [interv] = await db
    .select({
      id:          interventions.id,
      type:        interventions.type,
      status:      interventions.status,
      rdvTokenChoix:    interventions.rdvTokenChoix,
      rdvTokenCreneaux: interventions.rdvTokenCreneaux,
      scheduledAt: interventions.scheduledAt,
      address:     interventions.address,
      clientId:    interventions.clientId,
      clientName:  clients.name,
      techName:    techniciens.name,
    })
    .from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .leftJoin(techniciens, eq(interventions.technicienId, techniciens.id))
    .where(and(eq(interventions.rdvToken, token), isNull(interventions.supprimeLe)))
    .limit(1);

  if (!interv) return NextResponse.json({ error: "token_invalide" }, { status: 404 });
  if (interv.status === "annulée") return NextResponse.json({ error: "annulee" }, { status: 410 });
  if (interv.rdvTokenChoix !== null) return NextResponse.json({ error: "deja_utilise" }, { status: 409 });

  const creneaux = interv.rdvTokenCreneaux ? JSON.parse(interv.rdvTokenCreneaux) : [];
  return NextResponse.json({ interv, creneaux });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { choix } = await req.json(); // 1|2|3

  const [interv] = await db
    .select()
    .from(interventions)
    .where(and(eq(interventions.rdvToken, token), isNull(interventions.supprimeLe)))
    .limit(1);

  if (!interv) return NextResponse.json({ error: "token_invalide" }, { status: 404 });
  if (interv.status === "annulée") return NextResponse.json({ error: "annulee" }, { status: 410 });
  if (interv.rdvTokenChoix !== null) return NextResponse.json({ error: "deja_utilise" }, { status: 409 });

  const creneaux: { debut: string; fin: string; technicienId: string; label: string }[] = interv.rdvTokenCreneaux
    ? JSON.parse(interv.rdvTokenCreneaux)
    : [];
  const chosen = creneaux[choix - 1];
  if (!chosen) return NextResponse.json({ error: "choix_invalide" }, { status: 400 });

  await db
    .update(interventions)
    .set({
      status:         "planifiée",
      scheduledAt:    new Date(chosen.debut),
      technicienId:   chosen.technicienId,
      rdvTokenChoix:  choix,
      updatedAt:      new Date(),
    })
    .where(eq(interventions.id, interv.id));

  const [client] = await db.select().from(clients).where(eq(clients.id, interv.clientId)).limit(1);

  // Email confirmation client
  if (client?.email) {
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: process.env.EMAIL_TEST_OVERRIDE || client.email,
      subject: "Votre intervention Clim Expert est confirmée",
      html: `<p>Bonjour ${client.name},</p><p>Votre rendez-vous a été confirmé : <strong>${chosen.label}</strong>.</p><p>Adresse : ${interv.address ?? "à confirmer"}</p><p><a href="${process.env.NEXT_PUBLIC_URL}/rdv/${token}/annuler">Annuler ce rendez-vous</a></p>`,
    });
  }

  // Notif admin
  const [admin] = await db.select({ id: admins.id }).from(admins).limit(1);
  if (admin) {
    await db.insert(notifications).values({
      id: createId(), adminId: admin.id, type: "intervention_planifiee",
      titre: `Intervention confirmée — ${client?.name ?? "client"}`,
      contenu: chosen.label, refType: "intervention", refId: interv.id,
    });
  }

  // Notif technicien (stored in notifications with adminId = technicienId for now)
  if (chosen.technicienId) {
    await db.insert(notifications).values({
      id: createId(), adminId: chosen.technicienId, type: "nouvelle_intervention",
      titre: `Nouvelle intervention confirmée`,
      contenu: `${chosen.label} — ${client?.name ?? ""}`,
      refType: "intervention", refId: interv.id,
    });
  }

  return NextResponse.json({ ok: true, creneau: chosen });
}
