import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { techniciens } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export async function GET() {
  const list = await db
    .select()
    .from(techniciens)
    .where(eq(techniciens.role, "technico_commercial"));
  return NextResponse.json({ commerciaux: list.filter(t => !t.supprimeLe) });
}

export async function POST(req: NextRequest) {
  const { name, prenom, email, phone, color } = await req.json();
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nom et email requis" }, { status: 400 });
  }
  const [existing] = await db.select().from(techniciens).where(eq(techniciens.email, email.toLowerCase().trim()));
  if (existing) return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });

  const [t] = await db
    .insert(techniciens)
    .values({
      id: createId(),
      name: name.trim(),
      prenom: prenom?.trim() || null,
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || null,
      color: color ?? "#8b5cf6",
      role: "technico_commercial",
      active: true,
    })
    .returning();
  return NextResponse.json({ commercial: t }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const { id, ...fields } = await req.json();
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const allowed: Record<string, unknown> = {};
  if (fields.name)   allowed.name   = fields.name;
  if (fields.prenom !== undefined) allowed.prenom = fields.prenom;
  if (fields.email)  allowed.email  = fields.email.toLowerCase().trim();
  if (fields.phone !== undefined) allowed.phone  = fields.phone;
  if (fields.color)  allowed.color  = fields.color;
  if (fields.active !== undefined) allowed.active = fields.active;

  const [t] = await db.update(techniciens).set(allowed).where(eq(techniciens.id, id)).returning();
  if (!t) return NextResponse.json({ error: "Commercial introuvable" }, { status: 404 });
  return NextResponse.json({ commercial: t });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  await db.update(techniciens).set({ supprimeLe: new Date() }).where(eq(techniciens.id, id));
  return NextResponse.json({ success: true });
}
