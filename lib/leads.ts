import { db } from "@/lib/db";
import { leads, type Lead, type NewLead } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export type LeadStatus = "nouveau" | "contacté" | "devis_envoyé" | "gagné" | "perdu";
export type LeadSource = "alex" | "formulaire" | "téléphone" | "autre";

export type { Lead };

export async function createLead(
  data: Omit<NewLead, "id" | "createdAt" | "updatedAt" | "status">
): Promise<Lead> {
  const [lead] = await db.insert(leads).values(data).returning();
  return lead;
}

export async function getLeads(): Promise<Lead[]> {
  return db.select().from(leads).orderBy(desc(leads.createdAt));
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
  data: Partial<Pick<NewLead, "status" | "notes" | "email" | "location" | "clientId">>
): Promise<Lead | null> {
  const [lead] = await db
    .update(leads)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(leads.id, id))
    .returning();
  return lead ?? null;
}

export async function deleteLead(id: string): Promise<void> {
  await db.delete(leads).where(eq(leads.id, id));
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

  await db.delete(leads).where(eq(leads.id, duplicateId));

  return updated ?? null;
}
