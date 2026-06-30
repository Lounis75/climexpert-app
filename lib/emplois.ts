import { db } from "@/lib/db";
import { offresEmploi } from "@/lib/db/schema";
import { and, asc, desc, eq, isNull } from "drizzle-orm";

export type Offre = typeof offresEmploi.$inferSelect;
export type NewOffre = Partial<Pick<Offre, "titre" | "contrat" | "lieu" | "description" | "profil" | "actif" | "ordre">>;

export const CONTRATS = ["CDI", "CDD", "Intérim", "Alternance", "Stage", "Freelance"] as const;

/** Annonces ACTIVES, pour la page publique « Nous recrutons ». */
export async function getOffresActives(): Promise<Offre[]> {
  return db.select().from(offresEmploi)
    .where(and(eq(offresEmploi.actif, true), isNull(offresEmploi.supprimeLe)))
    .orderBy(asc(offresEmploi.ordre), desc(offresEmploi.createdAt));
}

/** Toutes les annonces (admin). */
export async function getOffres(): Promise<Offre[]> {
  return db.select().from(offresEmploi)
    .where(isNull(offresEmploi.supprimeLe))
    .orderBy(asc(offresEmploi.ordre), desc(offresEmploi.createdAt));
}

export async function getOffreById(id: string): Promise<Offre | null> {
  const [o] = await db.select().from(offresEmploi).where(and(eq(offresEmploi.id, id), isNull(offresEmploi.supprimeLe))).limit(1);
  return o ?? null;
}

export async function createOffre(data: NewOffre): Promise<Offre> {
  const [o] = await db.insert(offresEmploi).values({
    titre: (data.titre ?? "").trim() || "Poste",
    contrat: data.contrat ?? "CDI",
    lieu: data.lieu ?? "Île-de-France",
    description: (data.description ?? "").trim(),
    profil: data.profil ?? null,
    actif: data.actif ?? true,
    ordre: data.ordre ?? 0,
  }).returning();
  return o;
}

export async function updateOffre(id: string, data: NewOffre): Promise<void> {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ["titre", "contrat", "lieu", "description", "profil", "actif", "ordre"] as const) {
    if (data[k] !== undefined) patch[k] = data[k];
  }
  await db.update(offresEmploi).set(patch).where(eq(offresEmploi.id, id));
}

export async function deleteOffre(id: string): Promise<void> {
  await db.update(offresEmploi).set({ supprimeLe: new Date() }).where(eq(offresEmploi.id, id));
}
