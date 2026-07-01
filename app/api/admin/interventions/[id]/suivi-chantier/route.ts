import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { interventions, suivis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

// Fait avancer le suivi de chantier (installation) : acompte reçu (déclenche la commande matériel
// automatiquement) et matériel reçu. Ces jalons alimentent le suivi visible par le client.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const [iv] = await db.select().from(interventions).where(eq(interventions.id, id)).limit(1);
  if (!iv) return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });

  const now = new Date();
  const patch: Record<string, unknown> = { updatedAt: now };
  let note = "";

  if (body.jalon === "acompte") {
    if (body.value) {
      // Acompte reçu -> déclenche automatiquement la commande du matériel.
      patch.acompteRecuLe = now;
      patch.materielCommandeLe = now;
      note = "Acompte reçu, commande du matériel lancée.";
    } else {
      // Annulation : on remet à zéro la chaîne (commande + réception).
      patch.acompteRecuLe = null;
      patch.materielCommandeLe = null;
      patch.materielRecuLe = null;
      note = "Acompte marqué non reçu (suivi chantier réinitialisé).";
    }
  } else if (body.jalon === "materiel_recu") {
    if (body.value) {
      patch.materielRecuLe = now;
      // Si l'acompte n'avait pas été coché, on considère la commande passée aussi.
      if (!iv.materielCommandeLe) patch.materielCommandeLe = now;
      note = "Matériel reçu, prêt à planifier l'intervention.";
    } else {
      patch.materielRecuLe = null;
      note = "Matériel marqué non reçu.";
    }
  } else {
    return NextResponse.json({ error: "Jalon inconnu" }, { status: 400 });
  }

  await db.update(interventions).set(patch).where(eq(interventions.id, id));
  await db.insert(suivis).values({ clientId: iv.clientId, interventionId: id, type: "note", contenu: note }).catch((e) => logError("suiviChantier.note", e, { interventionId: id }));

  return NextResponse.json({
    ok: true,
    acompteRecuLe: patch.acompteRecuLe !== undefined ? patch.acompteRecuLe : iv.acompteRecuLe,
    materielCommandeLe: patch.materielCommandeLe !== undefined ? patch.materielCommandeLe : iv.materielCommandeLe,
    materielRecuLe: patch.materielRecuLe !== undefined ? patch.materielRecuLe : iv.materielRecuLe,
  });
}
