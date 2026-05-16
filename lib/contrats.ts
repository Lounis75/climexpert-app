import { db } from "@/lib/db";
import { contratsEntretien, clients } from "@/lib/db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { eq, desc, isNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export type Contrat = InferSelectModel<typeof contratsEntretien>;
export type ContratWithClient = Contrat & { clientName: string };

export async function getContrats(): Promise<ContratWithClient[]> {
  const rows = await db
    .select({ contrat: contratsEntretien, clientName: clients.name })
    .from(contratsEntretien)
    .leftJoin(clients, eq(contratsEntretien.clientId, clients.id))
    .where(isNull(contratsEntretien.supprimeLe))
    .orderBy(desc(contratsEntretien.createdAt));

  return rows.map((r) => ({ ...r.contrat, clientName: r.clientName ?? "—" }));
}

export async function createContrat(data: {
  clientId: string;
  units: number;
  prixUnitaireCt: number;
  startDate: string;
  nextVisit?: string;
}): Promise<Contrat> {
  const [c] = await db
    .insert(contratsEntretien)
    .values({ id: createId(), ...data, active: true })
    .returning();
  return c;
}

export async function updateContrat(
  id: string,
  data: Partial<Pick<InferInsertModel<typeof contratsEntretien>, "units" | "prixUnitaireCt" | "nextVisit" | "active">>
): Promise<Contrat | null> {
  const [c] = await db
    .update(contratsEntretien)
    .set(data)
    .where(eq(contratsEntretien.id, id))
    .returning();
  return c ?? null;
}

export async function deleteContrat(id: string): Promise<void> {
  await db
    .update(contratsEntretien)
    .set({ supprimeLe: new Date() })
    .where(eq(contratsEntretien.id, id));
}
