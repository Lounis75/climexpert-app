import { db } from "@/lib/db";
import { interventions, clients, techniciens, suivisPlanifies, rapportsIntervention, savTickets, suivis, documents } from "@/lib/db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { eq, desc, gte, asc, and, isNull, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export type Intervention = InferSelectModel<typeof interventions>;
export type Technicien = InferSelectModel<typeof techniciens>;

export type InterventionWithRefs = Intervention & {
  clientName: string;
  technicienName?: string;
  clientPhone?: string | null;
  clientEmail?: string | null;
  clientAddress?: string | null;
};

// Constantes d'affichage déplacées dans interventions-ui.ts (client-safe).
// Re-export pour conserver les imports serveur existants (@/lib/interventions).
export { TYPE_LABELS, TYPE_COLORS, STATUS_INTERVENTION } from "./interventions-ui";

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
    clientName: r.clientName ?? "-",
    technicienName: r.technicienName ?? undefined,
  }));
}

export async function getInterventionById(id: string): Promise<InterventionWithRefs | null> {
  const [row] = await db
    .select({
      intervention: interventions,
      clientName: clients.name,
      technicienName: techniciens.name,
      clientPhone: clients.phone,
      clientEmail: clients.email,
      clientAddress: clients.address,
    })
    .from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .leftJoin(techniciens, eq(interventions.technicienId, techniciens.id))
    .where(eq(interventions.id, id));

  if (!row) return null;
  return {
    ...row.intervention,
    clientName: row.clientName ?? "-",
    technicienName: row.technicienName ?? undefined,
    clientPhone: row.clientPhone,
    clientEmail: row.clientEmail,
    clientAddress: row.clientAddress,
  };
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
    clientName: r.clientName ?? "-",
    technicienName: r.technicienName ?? undefined,
  }));
}

export async function getTechniciens(): Promise<Technicien[]> {
  // Exclut les fiches supprimées ou désactivées (ne pas proposer un technicien parti).
  return db.select().from(techniciens)
    .where(and(isNull(techniciens.supprimeLe), eq(techniciens.active, true)))
    .orderBy(asc(techniciens.name));
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
  status: Intervention["status"],
  expectedVersion?: number,
): Promise<Intervention | null> {
  const patch: Partial<InferInsertModel<typeof interventions>> = {
    status,
    version: sql`${interventions.version} + 1` as unknown as number, // verrou optimiste
    updatedAt: new Date(),
  };
  if (status === "terminée") patch.completedAt = new Date();

  const conds = [eq(interventions.id, id)];
  if (typeof expectedVersion === "number") conds.push(eq(interventions.version, expectedVersion));
  const [i] = await db.update(interventions).set(patch).where(and(...conds)).returning();

  if (i && status === "terminée") {
    await planifierSuivis(i);
  }

  return i ?? null;
}

function addDaysToDate(d: Date, n: number): string {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r.toISOString().slice(0, 10);
}

async function planifierSuivis(interv: Intervention): Promise<void> {
  const base = interv.completedAt ?? new Date();
  const rows = [
    { typeSuivi: "j7",   canal: "email", datePrevue: addDaysToDate(base, 7)   },
    { typeSuivi: "j30",  canal: "email", datePrevue: addDaysToDate(base, 30)  },
    { typeSuivi: "j365", canal: "sms",   datePrevue: addDaysToDate(base, 365) },
  ];
  await db.insert(suivisPlanifies).values(
    rows.map((r) => ({ id: createId(), clientId: interv.clientId, interventionId: interv.id, statut: "planifie", ...r })),
  );
}

export async function updateInterventionNotes(id: string, notes: string, expectedVersion?: number): Promise<boolean> {
  const conds = [eq(interventions.id, id)];
  if (typeof expectedVersion === "number") conds.push(eq(interventions.version, expectedVersion));
  const res = await db.update(interventions)
    .set({ notes, version: sql`${interventions.version} + 1` as unknown as number, updatedAt: new Date() })
    .where(and(...conds))
    .returning({ id: interventions.id });
  return res.length > 0;
}

export async function deleteIntervention(id: string): Promise<void> {
  // Les tables filles ont des FK ON DELETE no action : il faut supprimer/détacher
  // leurs lignes avant l'intervention (sinon violation FK -> 500).
  // neon-http ne supporte pas les transactions interactives -> suppressions séquentielles.
  // Tightly coupled à l'intervention -> suppression :
  await db.delete(rapportsIntervention).where(eq(rapportsIntervention.interventionId, id));
  await db.delete(suivisPlanifies).where(eq(suivisPlanifies.interventionId, id));
  // Indépendants (appartiennent au client) -> on conserve en détachant la référence :
  await db.update(savTickets).set({ interventionId: null }).where(eq(savTickets.interventionId, id));
  await db.update(suivis).set({ interventionId: null }).where(eq(suivis.interventionId, id));
  // Documents (CERFA, facture...) : ils restent sur la fiche client, on retire juste le lien.
  await db.update(documents).set({ interventionId: null }).where(eq(documents.interventionId, id));
  await db.delete(interventions).where(eq(interventions.id, id));
}
