import { db } from "@/lib/db";
import { techniciens } from "@/lib/db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { eq, desc, isNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export type Technicien = InferSelectModel<typeof techniciens>;

export async function getTechniciens(): Promise<Technicien[]> {
  return db
    .select()
    .from(techniciens)
    .where(isNull(techniciens.supprimeLe))
    .orderBy(desc(techniciens.createdAt));
}

export async function getTechnicienById(id: string): Promise<Technicien | null> {
  const [t] = await db.select().from(techniciens).where(eq(techniciens.id, id));
  return t ?? null;
}

export async function createTechnicien(
  data: Pick<InferInsertModel<typeof techniciens>, "name" | "email" | "phone" | "color">
): Promise<Technicien> {
  const [t] = await db
    .insert(techniciens)
    .values({ id: createId(), ...data, active: true })
    .returning();
  return t;
}

export async function updateTechnicien(
  id: string,
  data: Partial<Pick<InferInsertModel<typeof techniciens>, "name" | "email" | "phone" | "color" | "active">>
): Promise<Technicien | null> {
  const [t] = await db
    .update(techniciens)
    .set(data)
    .where(eq(techniciens.id, id))
    .returning();
  return t ?? null;
}

export async function deleteTechnicien(id: string): Promise<void> {
  await db
    .update(techniciens)
    .set({ supprimeLe: new Date() })
    .where(eq(techniciens.id, id));
}
