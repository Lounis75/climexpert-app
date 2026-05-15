import { db } from "@/lib/db";
import { interventions, clients, techniciens } from "@/lib/db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { eq, desc, gte, asc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export type Intervention = InferSelectModel<typeof interventions>;
export type Technicien = InferSelectModel<typeof techniciens>;

export type InterventionWithRefs = Intervention & {
  clientName: string;
  technicienName?: string;
};

export const TYPE_LABELS: Record<string, string> = {
  installation: "Installation",
  entretien:    "Entretien",
  depannage:    "Dépannage",
  "contrat-pro": "Contrat pro",
  autre:        "Autre",
};

export const TYPE_COLORS: Record<string, string> = {
  installation:  "bg-sky-500/10 text-sky-400 border-sky-500/30",
  entretien:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  depannage:     "bg-red-500/10 text-red-400 border-red-500/30",
  "contrat-pro": "bg-violet-500/10 text-violet-400 border-violet-500/30",
  autre:         "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

export const STATUS_INTERVENTION: Record<string, { label: string; color: string }> = {
  planifiée:  { label: "Planifiée",  color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  en_cours:   { label: "En cours",   color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  terminée:   { label: "Terminée",   color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  annulée:    { label: "Annulée",    color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
};

export async function getInterventions(): Promise<InterventionWithRefs[]> {
  const rows = await db
    .select({
      intervention: interventions,
      clientName: clients.name,
      technicienName: techniciens.name,
    })
    .from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .leftJoin(techniciens, eq(interventions.technicienId, techniciens.id))
    .orderBy(asc(interventions.scheduledAt));

  return rows.map((r) => ({
    ...r.intervention,
    clientName: r.clientName ?? "—",
    technicienName: r.technicienName ?? undefined,
  }));
}

export async function getInterventionById(id: string): Promise<InterventionWithRefs | null> {
  const [row] = await db
    .select({
      intervention: interventions,
      clientName: clients.name,
      technicienName: techniciens.name,
    })
    .from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .leftJoin(techniciens, eq(interventions.technicienId, techniciens.id))
    .where(eq(interventions.id, id));

  if (!row) return null;
  return { ...row.intervention, clientName: row.clientName ?? "—", technicienName: row.technicienName ?? undefined };
}

export async function getUpcomingInterventions(): Promise<InterventionWithRefs[]> {
  const now = new Date();
  const rows = await db
    .select({
      intervention: interventions,
      clientName: clients.name,
      technicienName: techniciens.name,
    })
    .from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .leftJoin(techniciens, eq(interventions.technicienId, techniciens.id))
    .where(gte(interventions.scheduledAt, now))
    .orderBy(asc(interventions.scheduledAt));

  return rows.map((r) => ({
    ...r.intervention,
    clientName: r.clientName ?? "—",
    technicienName: r.technicienName ?? undefined,
  }));
}

export async function getTechniciens(): Promise<Technicien[]> {
  return db.select().from(techniciens).orderBy(asc(techniciens.name));
}

export async function createIntervention(
  data: Omit<InferInsertModel<typeof interventions>, "id" | "createdAt" | "updatedAt">
): Promise<Intervention> {
  const [i] = await db
    .insert(interventions)
    .values({ ...data, id: createId() })
    .returning();
  return i;
}

export async function updateInterventionStatus(
  id: string,
  status: Intervention["status"]
): Promise<Intervention | null> {
  const patch: Partial<InferInsertModel<typeof interventions>> = {
    status,
    updatedAt: new Date(),
  };
  if (status === "terminée") patch.completedAt = new Date();

  const [i] = await db.update(interventions).set(patch).where(eq(interventions.id, id)).returning();
  return i ?? null;
}

export async function updateInterventionNotes(id: string, notes: string): Promise<void> {
  await db.update(interventions).set({ notes, updatedAt: new Date() }).where(eq(interventions.id, id));
}

export async function deleteIntervention(id: string): Promise<void> {
  await db.delete(interventions).where(eq(interventions.id, id));
}
