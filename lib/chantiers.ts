import { db } from "@/lib/db";
import { chantiers, clients, type Chantier } from "@/lib/db/schema";
import { eq, desc, sql, and } from "drizzle-orm";

export type { Chantier };
export type ChantierWithClient = Chantier & { clientName: string };

export async function createChantier(data: {
  clientId: string; leadId?: string | null; nom: string; montantCt?: number | null;
}): Promise<Chantier> {
  const [c] = await db.insert(chantiers).values(data).returning();
  return c;
}

/** Idempotence : un chantier par prospect d'origine. */
export async function getChantierByLead(leadId: string): Promise<Chantier | null> {
  const [c] = await db.select().from(chantiers).where(eq(chantiers.leadId, leadId)).limit(1);
  return c ?? null;
}

export async function getChantierById(id: string): Promise<Chantier | null> {
  const [c] = await db.select().from(chantiers).where(eq(chantiers.id, id)).limit(1);
  return c ?? null;
}

export async function getChantiersByClient(clientId: string): Promise<Chantier[]> {
  return db.select().from(chantiers).where(eq(chantiers.clientId, clientId)).orderBy(desc(chantiers.createdAt));
}

export async function getChantiers(): Promise<ChantierWithClient[]> {
  const rows = await db
    .select({ chantier: chantiers, clientName: clients.name })
    .from(chantiers)
    .leftJoin(clients, eq(chantiers.clientId, clients.id))
    .orderBy(desc(chantiers.createdAt));
  return rows.map((r) => ({ ...r.chantier, clientName: r.clientName ?? "-" }));
}

export async function updateChantier(
  id: string,
  data: Partial<Pick<Chantier, "nom" | "statut" | "montantCt" | "notes">>,
  expectedVersion?: number,
): Promise<Chantier | null> {
  const conds = [eq(chantiers.id, id)];
  if (typeof expectedVersion === "number") conds.push(eq(chantiers.version, expectedVersion));
  const [c] = await db.update(chantiers)
    .set({ ...data, version: sql`${chantiers.version} + 1` as unknown as number, updatedAt: new Date() })
    .where(and(...conds))
    .returning();
  return c ?? null;
}
