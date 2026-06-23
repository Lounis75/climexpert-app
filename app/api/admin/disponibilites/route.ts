import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { disponibilitesBloquees, techniciens } from "@/lib/db/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Indisponibilités (congés / créneaux off) gérées par l'admin pour n'importe quel membre
// de l'équipe. Pendant admin de /api/technicien/disponibilites (qui, lui, est verrouillé sur
// le technicien connecté). Routes /api/admin/* protégées par le proxy (middleware).

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const conds = [];
  if (start) conds.push(gte(disponibilitesBloquees.dateFin, new Date(start)));
  if (end) { const e = new Date(end); e.setHours(23, 59, 59, 999); conds.push(lte(disponibilitesBloquees.dateDebut, e)); }
  const rows = await db
    .select({
      id: disponibilitesBloquees.id,
      technicienId: disponibilitesBloquees.technicienId,
      technicienName: techniciens.name,
      dateDebut: disponibilitesBloquees.dateDebut,
      dateFin: disponibilitesBloquees.dateFin,
      motif: disponibilitesBloquees.motif,
    })
    .from(disponibilitesBloquees)
    .leftJoin(techniciens, eq(disponibilitesBloquees.technicienId, techniciens.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(disponibilitesBloquees.dateDebut);
  return NextResponse.json({ indispos: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { technicienId, dateDebut, dateFin, motif } = body;
  if (!technicienId || !dateDebut) {
    return NextResponse.json({ error: "Technicien et date de début requis" }, { status: 400 });
  }
  const debut = new Date(dateDebut);
  const fin = new Date(dateFin || dateDebut);
  if (isNaN(debut.getTime()) || isNaN(fin.getTime())) {
    return NextResponse.json({ error: "Dates invalides" }, { status: 400 });
  }
  const [row] = await db.insert(disponibilitesBloquees).values({
    id: createId(), technicienId, dateDebut: debut, dateFin: fin, motif: motif || null,
  }).returning();
  return NextResponse.json({ indispo: row }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await db.delete(disponibilitesBloquees).where(eq(disponibilitesBloquees.id, id));
  return NextResponse.json({ ok: true });
}
