import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { periodesCapacite } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export async function GET() {
  const periodes = await db.select().from(periodesCapacite).orderBy(periodesCapacite.dateDebut);
  return NextResponse.json({ periodes });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { nom, dateDebut, dateFin, maxInterventionsSemaine, note } = body;
  if (!nom || !dateDebut || !dateFin || !maxInterventionsSemaine) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }
  const periode = await db.insert(periodesCapacite).values({
    id: createId(), nom, dateDebut, dateFin,
    maxInterventionsSemaine: Number(maxInterventionsSemaine),
    note: note || null,
  }).returning();
  return NextResponse.json({ periode: periode[0] }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  if (fields.maxInterventionsSemaine) fields.maxInterventionsSemaine = Number(fields.maxInterventionsSemaine);
  await db.update(periodesCapacite).set(fields).where(eq(periodesCapacite.id, id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await db.delete(periodesCapacite).where(eq(periodesCapacite.id, id));
  return NextResponse.json({ ok: true });
}
