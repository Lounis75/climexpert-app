import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { disponibilitesBloquees } from "@/lib/db/schema";
import { eq, and, gte } from "drizzle-orm";
import { verifyTechnicienToken, TECH_COOKIE_NAME } from "@/lib/auth";

async function getSession(req: NextRequest) {
  const token = req.cookies.get(TECH_COOKIE_NAME)?.value;
  return token ? verifyTechnicienToken(token) : null;
}

// Le portail envoie des dates sans heure ("2026-06-22"). new Date() les parse en UTC minuit,
// ce qui décale l'indispo et la rend invisible sur la grille (heure locale). On borne donc
// en journée LOCALE pleine : début 00:00, fin 23:59:59 (cohérent avec le modal admin).
function toLocalStart(s: string) { return new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s); }
function toLocalEnd(s: string)   { return new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T23:59:59` : s); }

export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const rows = await db
    .select()
    .from(disponibilitesBloquees)
    .where(
      and(
        eq(disponibilitesBloquees.technicienId, session.sub),
        gte(disponibilitesBloquees.dateFin, new Date())
      )
    )
    .orderBy(disponibilitesBloquees.dateDebut);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { dateDebut, dateFin, motif } = await req.json();
  if (!dateDebut || !dateFin) return NextResponse.json({ error: "Dates requises" }, { status: 400 });

  const [row] = await db
    .insert(disponibilitesBloquees)
    .values({
      technicienId: session.sub,
      dateDebut:    toLocalStart(dateDebut),
      dateFin:      toLocalEnd(dateFin),
      motif:        motif ?? null,
    })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

  await db
    .delete(disponibilitesBloquees)
    .where(
      and(
        eq(disponibilitesBloquees.id, id),
        eq(disponibilitesBloquees.technicienId, session.sub)
      )
    );

  return NextResponse.json({ ok: true });
}
