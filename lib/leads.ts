import { db } from "@/lib/db";
import { leads, interventions, suivis, techniciens, type Lead, type NewLead } from "@/lib/db/schema";
import { eq, desc, isNull, and, inArray, ne, isNotNull, asc } from "drizzle-orm";

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

export async function getLeadById(id: string): Promise<Lead | null> {
  const [lead] = await db.select().from(leads).where(eq(leads.id, id));
  return lead ?? null;
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus
): Promise<Lead | null> {
  const [lead] = await db
    .update(leads)
    .set({ status, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  return lead ?? null;
}

export async function updateLead(
  id: string,
  data: Partial<Pick<NewLead, "status" | "notes" | "email" | "location" | "address" | "project" | "name" | "phone" | "clientId" | "commercialId" | "consentementMarketing" | "consentementLe" | "montantDevisCt" | "prochaineEtape" | "rdvDate" | "dateSouhaiteeIntervention" | "prochaineActionLe">>
): Promise<Lead | null> {
  const [lead] = await db
    .update(leads)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  return lead ?? null;
}

export async function deleteLead(id: string): Promise<void> {
  await db.update(leads).set({ supprimeLe: new Date() }).where(eq(leads.id, id));
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
    .set({ ...merged, updatedAt: new Date() })
    .where(eq(leads.id, masterId))
    .returning();

  await db.update(leads).set({ supprimeLe: new Date() }).where(eq(leads.id, duplicateId));

  return updated ?? null;
}
