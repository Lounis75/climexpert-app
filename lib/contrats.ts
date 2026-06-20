import { db } from "@/lib/db";
import { contratsEntretien, clients } from "@/lib/db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { eq, desc, isNull, like, count } from "drizzle-orm";
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

// Numéro de contrat auto-incrémenté sur l'année : ENT-2026-0001, 0002, …
async function nextContratNumero(): Promise<string> {
  const year = new Date().getFullYear();
  const [{ n }] = await db
    .select({ n: count() })
    .from(contratsEntretien)
    .where(like(contratsEntretien.numero, `ENT-${year}-%`));
  return `ENT-${year}-${String(Number(n) + 1).padStart(4, "0")}`;
}

export async function createContrat(data: {
  clientId: string;
  units: number;
  prixUnitaireCt: number;
  startDate: string;
  nextVisit?: string;
  fluide?: string;
}): Promise<Contrat> {
  const numero = await nextContratNumero();
  const [c] = await db
    .insert(contratsEntretien)
    .values({
      id: createId(),
      clientId: data.clientId,
      units: data.units,
      prixUnitaireCt: data.prixUnitaireCt,
      startDate: data.startDate,
      nextVisit: data.nextVisit,
      fluide: data.fluide || "R410A",
      numero,
      active: true,
    })
    .returning();

  // Lien client → contrat + rappel 330 j (réutilise le système d'alerte entretien :
  // tâche dashboard + notification ~35 j avant l'échéance annuelle).
  const relance = new Date(data.startDate);
  if (!isNaN(relance.getTime())) {
    relance.setDate(relance.getDate() + 330);
    await db.update(clients).set({
      contratEntretienId: c.id,
      prochainEntretienLe: relance.toISOString().split("T")[0],
      relanceEntretienNotifiee: false,
      updatedAt: new Date(),
    }).where(eq(clients.id, data.clientId)).catch((e) => console.error("[createContrat] rappel 330j:", e));
  }

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
