import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [row] = await db.select({ id: leads.id }).from(leads).where(eq(leads.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await db.delete(leads).where(eq(leads.id, id));

  return NextResponse.json({ ok: true, deleted: "lead", id });
}
