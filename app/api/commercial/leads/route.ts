import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq, isNull, desc, sql, and } from "drizzle-orm";
import { verifyCommercialToken, COMMERCIAL_COOKIE_NAME } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get(COMMERCIAL_COOKIE_NAME)?.value;
  const session = token ? await verifyCommercialToken(token) : null;
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const list = await db
    .select()
    .from(leads)
    .where(eq(leads.commercialId, session.sub))
    .orderBy(desc(leads.createdAt));

  return NextResponse.json({ leads: list });
}

export async function PATCH(req: NextRequest) {
  const token = req.cookies.get(COMMERCIAL_COOKIE_NAME)?.value;
  const session = token ? await verifyCommercialToken(token) : null;
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, notes, version } = await req.json();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead || lead.commercialId !== session.sub) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }

  // Verrou optimiste : si une version est fournie et ne correspond plus → conflit.
  const conds = [eq(leads.id, id)];
  if (typeof version === "number") conds.push(eq(leads.version, version));
  const [updated] = await db
    .update(leads)
    .set({ notes, version: sql`${leads.version} + 1`, updatedAt: new Date() })
    .where(and(...conds))
    .returning();
  if (!updated) {
    return NextResponse.json(
      { error: "Cette fiche a été modifiée par quelqu'un d'autre. Rechargez avant de réenregistrer.", conflict: true, lead },
      { status: 409 },
    );
  }
  return NextResponse.json({ lead: updated });
}
