import { db } from "@/lib/db";
import { interventions, clients, techniciens, suivisPlanifies, rapportsIntervention, savTickets, suivis, documents } from "@/lib/db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { eq, desc, gte, asc, and, isNull, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { logError } from "@/lib/observability";

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
  // Fenêtre glissante : on ne charge PAS tout l'historique (payload qui grossit sans fin avec
  // les années). Les 90 derniers jours + le futur couvrent l'agenda et la section « passées »
  // récente. Les « à affecter » (planifiée sans date) doivent rester visibles quelle que soit
  // la date, donc on inclut aussi les interventions sans scheduledAt. + filtre supprimeLe.
  const depuis = new Date();
  depuis.setDate(depuis.getDate() - 90);
  const rows = await db
    .select({
      intervention: interventions,
      clientName: clients.name,
      technicienName: techniciens.name,
    })
    .from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .leftJoin(techniciens, eq(interventions.technicienId, techniciens.id))
    .where(and(
      isNull(interventions.supprimeLe),
      sql`(${interventions.scheduledAt} is null or ${interventions.scheduledAt} >= ${depuis})`,
    ))
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

// Programme les suivis post-chantier (avis J+7, relance J+30, SMS J+365). Exporté : la clôture
// réelle passe par la route rapports (pas par updateInterventionStatus). Idempotent : ne replanifie
// pas si des suivis existent déjà pour cette intervention (clôture rejouée, double appel).
export async function planifierSuivis(interv: Pick<Intervention, "id" | "clientId" | "completedAt">): Promise<void> {
  const [deja] = await db
    .select({ id: suivisPlanifies.id })
    .from(suivisPlanifies)
    .where(eq(suivisPlanifies.interventionId, interv.id))
    .limit(1);
  if (deja) return;
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
  // neon-http ne supporte pas les transactions interactives -> suppressions séquentielles.
  // Ordre prudent : on DÉTACHE D'ABORD ce qui appartient au client (documents CERFA/facture, SAV,
  // suivis) pour le préserver même si une étape suivante échoue ; on supprime ENSUITE ce qui est
  // propre à l'intervention (suivis planifiés, rapport), et l'intervention en dernier. Toute erreur
  // est journalisée (au lieu d'un échec muet) puis remontée.
  try {
    await db.update(documents).set({ interventionId: null }).where(eq(documents.interventionId, id));
    await db.update(savTickets).set({ interventionId: null }).where(eq(savTickets.interventionId, id));
    await db.update(suivis).set({ interventionId: null }).where(eq(suivis.interventionId, id));
    await db.delete(suivisPlanifies).where(eq(suivisPlanifies.interventionId, id));
    await db.delete(rapportsIntervention).where(eq(rapportsIntervention.interventionId, id));
    await db.delete(interventions).where(eq(interventions.id, id));
  } catch (e) {
    logError("intervention.delete", e, { interventionId: id });
    throw e;
  }
}
