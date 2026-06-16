import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
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

  const { id, notes } = await req.json();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead || lead.commercialId !== session.sub) {
    return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
  }

  const [updated] = await db
    .update(leads)
    .set({ notes, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  return NextResponse.json({ lead: updated });
}
