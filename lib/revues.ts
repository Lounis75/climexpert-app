import { db } from "@/lib/db";
import { revuesDevis } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

export type Revue = typeof revuesDevis.$inferSelect;

/** Revues en attente d'un avis d'expert (les plus récentes d'abord). */
export async function getRevuesEnAttente(): Promise<Revue[]> {
  return db.select().from(revuesDevis).where(eq(revuesDevis.status, "en_attente")).orderBy(desc(revuesDevis.createdAt));
}

/** Toutes les revues (historique), plus récentes d'abord. */
export async function getRevues(limit = 60): Promise<Revue[]> {
  return db.select().from(revuesDevis).orderBy(desc(revuesDevis.createdAt)).limit(limit);
}

export async function getRevueById(id: string): Promise<Revue | null> {
  const [r] = await db.select().from(revuesDevis).where(eq(revuesDevis.id, id)).limit(1);
  return r ?? null;
}

/** Nombre de revues en attente (pour la pastille). */
export async function countRevuesEnAttente(): Promise<number> {
  const rows = await db.select({ id: revuesDevis.id }).from(revuesDevis).where(eq(revuesDevis.status, "en_attente"));
  return rows.length;
}
