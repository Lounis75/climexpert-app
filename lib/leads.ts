import { db } from "@/lib/db";
import { leads, interventions, suivis, techniciens, type Lead, type NewLead } from "@/lib/db/schema";
import { eq, desc, isNull, and, inArray, notInArray, ne, isNotNull, asc, ilike, or, count, sql, type SQL } from "drizzle-orm";

export type LeadStatus = "nouveau" | "pas_de_reponse" | "contacté" | "devis_envoyé" | "gagné" | "perdu";
export type LeadSource = "alex" | "formulaire" | "téléphone" | "whatsapp" | "autre";

export type { Lead };

export type RendezVous = {
  id: string;
  name: string;
  phone: string;
  rdvDate: Date | null;
  location: string | null;
  address: string | null;
  project: string | null;
  status: string;
  commercialId: string | null;
  commercialName: string | null;
};

/** Détecte un prospect actif (non supprimé) avec le même téléphone + nom (insensible
 *  à la casse) — pour empêcher les doublons saisis manuellement. */
export async function findActiveLeadByNamePhone(name: string, phone: string): Promise<Lead | null> {
  const rows = await db.select().from(leads)
    .where(and(eq(leads.phone, phone.trim()), isNull(leads.supprimeLe)));
  const target = name.trim().toLowerCase();
  return rows.find((r) => r.name.trim().toLowerCase() === target) ?? null;
}

/** Rendez-vous commerciaux (« RDV pris ») = prospects avec une date de RDV.
 *  Admin : tous (opts vide). Commercial : passer commercialId pour ne voir que les siens. */
export async function getRendezVous(opts?: { commercialId?: string }): Promise<RendezVous[]> {
  const conds = [isNotNull(leads.rdvDate), ne(leads.status, "perdu")];
  if (opts?.commercialId) conds.push(eq(leads.commercialId, opts.commercialId));
  const rows = await db
    .select({
      id: leads.id, name: leads.name, phone: leads.phone, rdvDate: leads.rdvDate, location: leads.location,
      address: leads.address, project: leads.project, status: leads.status,
      commercialId: leads.commercialId, commercialName: techniciens.name,
    })
    .from(leads)
    .leftJoin(techniciens, eq(leads.commercialId, techniciens.id))
    .where(and(...conds))
    .orderBy(asc(leads.rdvDate));
  return rows.map((r) => ({ ...r, commercialName: r.commercialName ?? null }));
}

// Date de la dernière activité (échange logué) par prospect → « dernière activité » sur la carte.
export async function getLastActivityByLead(leadIds: string[]): Promise<Record<string, string>> {
  if (leadIds.length === 0) return {};
  const rows = await db
    .select({ leadId: suivis.leadId, createdAt: suivis.createdAt })
    .from(suivis)
    .where(inArray(suivis.leadId, leadIds));
  const map: Record<string, string> = {};
  for (const r of rows) {
    if (!r.leadId) continue;
    const t = new Date(r.createdAt).toISOString();
    if (!map[r.leadId] || t > map[r.leadId]) map[r.leadId] = t;
  }
  return map;
}

// Prospects « passés en production » : gagnés ET dont une intervention liée est planifiée
// (date + technicien affectés). Ils sortent du Kanban CRM (le pilotage vit dans Terrain).
export async function getEnProductionLeadIds(leadList: Lead[]): Promise<Set<string>> {
  const clientIds = leadList
    .filter((l) => l.status === "gagné" && l.clientId)
    .map((l) => l.clientId as string);
  if (clientIds.length === 0) return new Set();

  const rows = await db
    .select({ clientId: interventions.clientId })
    .from(interventions)
    .where(and(
      inArray(interventions.clientId, clientIds),
      isNotNull(interventions.scheduledAt),
      isNotNull(interventions.technicienId),
      ne(interventions.status, "annulée"),
      isNull(interventions.supprimeLe),
    ));

  const prodClients = new Set(rows.map((r) => r.clientId).filter((x): x is string => !!x));
  return new Set(leadList.filter((l) => l.clientId && prodClients.has(l.clientId)).map((l) => l.id));
}

export async function createLead(
  data: Omit<NewLead, "id" | "createdAt" | "updatedAt" | "status">
): Promise<Lead> {
  const [lead] = await db.insert(leads).values(data).returning();
  return lead;
}

export async function getLeads(): Promise<Lead[]> {
  return db.select().from(leads).where(isNull(leads.supprimeLe)).orderBy(desc(leads.createdAt));
}

const STATUS_LIST: LeadStatus[] = ["nouveau", "pas_de_reponse", "contacté", "devis_envoyé", "gagné", "perdu"];

/** Ensemble des prospects « en production » (gagnés AVEC une intervention planifiée
 *  date+technicien) → masqués du Kanban. Calculé en une requête (pas par lot). */
export async function getEnProductionLeadIdSet(): Promise<Set<string>> {
  const rows = await db.select({ id: leads.id })
    .from(leads)
    .innerJoin(interventions, eq(leads.clientId, interventions.clientId))
    .where(and(
      eq(leads.status, "gagné"),
      isNotNull(leads.clientId),
      isNotNull(interventions.scheduledAt),
      isNotNull(interventions.technicienId),
      ne(interventions.status, "annulée"),
      isNull(interventions.supprimeLe),
      isNull(leads.supprimeLe),
    ));
  return new Set(rows.map((r) => r.id));
}

/** Données du Kanban : jusqu'à `cap` prospects les plus récents PAR colonne (statut),
 *  + le total réel par statut. Évite de charger toute la table. */
export async function getLeadsBoard(cap = 50): Promise<{ leads: Lead[]; counts: Record<string, number>; enProductionCount: number }> {
  const enProd = await getEnProductionLeadIdSet();
  const enProdArr = [...enProd];

  const countRows = await db.select({ status: leads.status, value: count() })
    .from(leads).where(isNull(leads.supprimeLe)).groupBy(leads.status);
  const counts: Record<string, number> = {};
  for (const r of countRows) counts[r.status] = Number(r.value);
  counts["gagné"] = Math.max(0, (counts["gagné"] ?? 0) - enProd.size); // les "en production" sont masqués

  const perStatus = await Promise.all(STATUS_LIST.map((st) => {
    const conds: SQL[] = [isNull(leads.supprimeLe), eq(leads.status, st)];
    if (st === "gagné" && enProdArr.length) conds.push(notInArray(leads.id, enProdArr));
    return db.select().from(leads).where(and(...conds)).orderBy(desc(leads.createdAt)).limit(cap);
  }));
  return { leads: perStatus.flat(), counts, enProductionCount: enProd.size };
}

/** « Charger plus » d'une colonne : prospects suivants d'un statut donné. */
export async function getLeadsByStatusPaged(opts: { status: LeadStatus; offset: number; limit: number }): Promise<Lead[]> {
  const conds: SQL[] = [isNull(leads.supprimeLe), eq(leads.status, opts.status)];
  if (opts.status === "gagné") {
    const enProd = [...await getEnProductionLeadIdSet()];
    if (enProd.length) conds.push(notInArray(leads.id, enProd));
  }
  return db.select().from(leads).where(and(...conds)).orderBy(desc(leads.createdAt))
    .limit(Math.min(100, Math.max(1, opts.limit))).offset(Math.max(0, opts.offset));
}

/** Vue Liste paginée + recherche serveur (nom / téléphone / ville). */
export async function getLeadsPaginated(opts: { search?: string; page?: number; limit?: number } = {}): Promise<{ items: Lead[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts.limit ?? 50)));
  const offset = (page - 1) * pageSize;
  const q = (opts.search ?? "").trim();
  const filters: SQL[] = [isNull(leads.supprimeLe)];
  // Exclut les « en production » (gagnés + intervention planifiée) → cohérent avec le
  // Kanban : la recherche/charger-plus ne doit pas les réinjecter dans les colonnes.
  const enProd = [...await getEnProductionLeadIdSet()];
  if (enProd.length) filters.push(notInArray(leads.id, enProd));
  if (q) {
    const like = `%${q}%`;
    filters.push(or(ilike(leads.name, like), ilike(leads.phone, like), ilike(leads.location, like))!);
  }
  const where = and(...filters);
  const [items, totalRows] = await Promise.all([
    db.select().from(leads).where(where).orderBy(desc(leads.createdAt)).limit(pageSize).offset(offset),
    db.select({ value: count() }).from(leads).where(where),
  ]);
  return { items, total: Number(totalRows[0]?.value ?? 0), page, pageSize };
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const [lead] = await db.select().from(leads).where(eq(leads.id, id));
  return lead ?? null;
}

export async function updateLead(
  id: string,
  data: Partial<Pick<NewLead, "status" | "notes" | "email" | "location" | "address" | "project" | "name" | "phone" | "clientId" | "commercialId" | "consentementMarketing" | "consentementLe" | "montantDevisCt" | "prochaineEtape" | "rdvDate" | "dateSouhaiteeIntervention" | "prochaineActionLe" | "favori">>,
  expectedVersion?: number,
): Promise<Lead | null> {
  // Verrou optimiste : si expectedVersion est fourni, la mise à jour n'a lieu que si
  // la version en base correspond (sinon quelqu'un a modifié entre-temps → 0 ligne).
  const conds = [eq(leads.id, id)];
  if (typeof expectedVersion === "number") conds.push(eq(leads.version, expectedVersion));
  const [lead] = await db
    .update(leads)
    .set({ ...data, version: sql`${leads.version} + 1`, updatedAt: new Date() })
    .where(and(...conds))
    .returning();
  return lead ?? null;
}

export async function deleteLead(id: string): Promise<void> {
  await db.update(leads).set({ supprimeLe: new Date(), version: sql`${leads.version} + 1` }).where(eq(leads.id, id));
}

// Fusionne `duplicateId` dans `masterId` : garde les champs du master, complète
// avec ceux du doublon si vides, concatène les notes, supprime le doublon.
export async function mergeLeads(masterId: string, duplicateId: string): Promise<Lead | null> {
  const [master, duplicate] = await Promise.all([
    getLeadById(masterId),
    getLeadById(duplicateId),
  ]);
  if (!master || !duplicate) return null;

  const merged: Partial<Pick<NewLead, "email" | "location" | "project" | "message" | "notes" | "status">> = {
    email:    master.email    ?? duplicate.email    ?? undefined,
    location: master.location ?? duplicate.location ?? undefined,
    project:  master.project  ?? duplicate.project  ?? undefined,
    message:  master.message  ?? duplicate.message  ?? undefined,
    status:   master.status !== "nouveau" ? master.status : duplicate.status,
  };

  const parts = [master.notes, duplicate.notes].filter(Boolean);
  if (parts.length) merged.notes = parts.join("\n---\n");

  const [updated] = await db
    .update(leads)
    .set({ ...merged, version: sql`${leads.version} + 1` as unknown as number, updatedAt: new Date() })
    .where(eq(leads.id, masterId))
    .returning();

  await db.update(leads).set({ supprimeLe: new Date(), version: sql`${leads.version} + 1` }).where(eq(leads.id, duplicateId));

  return updated ?? null;
}
