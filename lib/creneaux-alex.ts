import { db } from "@/lib/db";
import { creneauxAlex, leads, techniciens } from "@/lib/db/schema";
import { and, eq, gt, isNull, asc, sql } from "drizzle-orm";

export type CreneauAlex = typeof creneauxAlex.$inferSelect;

// Formatage lisible d'un créneau (heure de Paris).
export function labelCreneau(debut: Date | string, fin: Date | string): string {
  const d = new Date(debut), f = new Date(fin);
  const jour = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });
  const h1 = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  const h2 = f.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  return `${jour.charAt(0).toUpperCase() + jour.slice(1)}, ${h1} à ${h2}`;
}

/** Créneaux OUVERTS et à venir, pour qu'Alex les propose au client. */
export async function getOpenSlots(limit = 6): Promise<CreneauAlex[]> {
  return db.select().from(creneauxAlex)
    .where(and(eq(creneauxAlex.statut, "ouvert"), isNull(creneauxAlex.supprimeLe), gt(creneauxAlex.debut, new Date())))
    .orderBy(asc(creneauxAlex.debut))
    .limit(limit);
}

/** Tous les créneaux à venir (admin) avec le nom du commercial rattaché. */
export async function getSlotsAdmin(): Promise<(CreneauAlex & { commercialName: string | null })[]> {
  const rows = await db.select({ c: creneauxAlex, commercialName: techniciens.name })
    .from(creneauxAlex)
    .leftJoin(techniciens, eq(creneauxAlex.commercialId, techniciens.id))
    .where(and(isNull(creneauxAlex.supprimeLe), gt(creneauxAlex.debut, new Date())))
    .orderBy(asc(creneauxAlex.debut));
  return rows.map((r) => ({ ...r.c, commercialName: r.commercialName ?? null }));
}

export async function addSlot(data: { debut: Date; fin: Date; commercialId?: string | null }): Promise<CreneauAlex> {
  const [c] = await db.insert(creneauxAlex).values({
    debut: data.debut, fin: data.fin, commercialId: data.commercialId ?? null,
  }).returning();
  return c;
}

export async function deleteSlot(id: string): Promise<void> {
  await db.update(creneauxAlex).set({ supprimeLe: new Date() }).where(eq(creneauxAlex.id, id));
}

/** Réserve un créneau pour un prospect. Atomique (WHERE statut='ouvert') : deux clients ne
 *  peuvent pas prendre le même créneau. Pose aussi le RDV sur la fiche prospect. Renvoie le
 *  créneau réservé, ou null si déjà pris / introuvable. */
export async function bookSlot(slotId: string, leadId: string): Promise<CreneauAlex | null> {
  const [slot] = await db.update(creneauxAlex)
    .set({ statut: "reserve", leadId, reserveLe: new Date() })
    .where(and(eq(creneauxAlex.id, slotId), eq(creneauxAlex.statut, "ouvert"), isNull(creneauxAlex.supprimeLe), gt(creneauxAlex.debut, new Date())))
    .returning();
  if (!slot) return null;

  await db.update(leads).set({
    rdvDate: slot.debut,
    rdvParAlex: true,
    ...(slot.commercialId ? { commercialId: slot.commercialId } : {}),
    prochaineEtape: "rdv_pris",
    statutChangeLe: new Date(),
    version: sql`${leads.version} + 1`,
    updatedAt: new Date(),
  }).where(eq(leads.id, leadId));

  return slot;
}
