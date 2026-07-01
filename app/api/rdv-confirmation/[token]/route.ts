import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interventions, clients, notifications } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

// PUBLIC (protégé par le jeton) : le client confirme son rendez-vous ou signale un problème depuis
// l'e-mail de confirmation. Remonte l'info sur la fiche intervention + notifie l'équipe.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!rateLimit(`rdvconfirm:${clientIp(req)}`, 20, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez plus tard." }, { status: 429 });
  }

  const [iv] = await db.select().from(interventions).where(and(eq(interventions.confirmToken, token), isNull(interventions.supprimeLe))).limit(1);
  if (!iv) return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });

  const body = await req.json().catch(() => null);
  const action = body?.action === "probleme" ? "probleme" : body?.action === "confirme" ? "confirme" : null;
  if (!action) return NextResponse.json({ error: "Action invalide" }, { status: 400 });

  const message = action === "probleme" ? String(body?.message ?? "").trim().slice(0, 1500) : null;

  await db.update(interventions).set({
    clientConfirmation: action,
    clientConfirmationLe: new Date(),
    clientConfirmationMsg: message,
    updatedAt: new Date(),
  }).where(eq(interventions.id, iv.id));

  // Notification équipe
  const [cli] = await db.select({ name: clients.name }).from(clients).where(eq(clients.id, iv.clientId)).limit(1);
  const nom = cli?.name ?? "Le client";
  await db.insert(notifications).values(
    action === "confirme"
      ? { type: "rdv_confirmation", titre: `RDV confirmé par le client : ${nom}`, contenu: `${nom} a confirmé son rendez-vous.`, refType: "intervention", refId: iv.id }
      : { type: "rdv_probleme", titre: `Problème RDV signalé : ${nom}`, contenu: `${nom} a signalé un problème sur son rendez-vous.${message ? ` « ${message} »` : ""} À recontacter.`, refType: "intervention", refId: iv.id },
  ).catch((e) => logError("rdvconfirm.notif", e, { interventionId: iv.id }));

  return NextResponse.json({ ok: true });
}
