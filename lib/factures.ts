import { db } from "@/lib/db";
import { factures, devis, clients, lignesDevis } from "@/lib/db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { eq, desc, count, and, lt } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { centimesToEuros } from "@/lib/devis";
import { createNotification } from "@/lib/notifications";

export type Facture = InferSelectModel<typeof factures>;
export type LigneDevis = InferSelectModel<typeof lignesDevis>;
export type { };

export { centimesToEuros };

export type FactureWithRefs = Facture & {
  clientName: string;
  devisNumber?: string;
  lignes?: LigneDevis[];
};

async function generateFactureNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const [{ value }] = await db.select({ value: count() }).from(factures);
  const n = Number(value) + 1;
  return `FACT-${year}-${String(n).padStart(3, "0")}`;
}

export async function markOverdueFactures(): Promise<void> {
  const today = new Date().toISOString().split("T")[0];

  // Récupérer les factures qui vont passer en retard pour créer les notifications
  const toMark = await db
    .select({ id: factures.id, number: factures.number })
    .from(factures)
    .where(and(eq(factures.status, "en_attente"), lt(factures.dueDate, today)));

  if (toMark.length === 0) return;

  await db
    .update(factures)
    .set({ status: "en_retard", updatedAt: new Date() })
    .where(and(eq(factures.status, "en_attente"), lt(factures.dueDate, today)));

  // Notifications (fire-and-forget)
  for (const f of toMark) {
    createNotification({
      type: "facture_en_retard",
      titre: `Facture en retard — ${f.number}`,
      refType: "facture",
      refId: f.id,
    }).catch(() => {});
  }
}

export async function getFactures(): Promise<FactureWithRefs[]> {
  await markOverdueFactures();
  const rows = await db
    .select({
      facture: factures,
      clientName: clients.name,
      devisNumber: devis.number,
    })
    .from(factures)
    .leftJoin(clients, eq(factures.clientId, clients.id))
    .leftJoin(devis, eq(factures.devisId, devis.id))
    .orderBy(desc(factures.createdAt));

  return rows.map((r) => ({
    ...r.facture,
    clientName: r.clientName ?? "—",
    devisNumber: r.devisNumber ?? undefined,
  }));
}

export async function getFactureById(id: string): Promise<FactureWithRefs | null> {
  await markOverdueFactures();
  const [row] = await db
    .select({
      facture: factures,
      clientName: clients.name,
      devisNumber: devis.number,
    })
    .from(factures)
    .leftJoin(clients, eq(factures.clientId, clients.id))
    .leftJoin(devis, eq(factures.devisId, devis.id))
    .where(eq(factures.id, id));

  if (!row) return null;

  const lignes = row.facture.devisId
    ? await db.select().from(lignesDevis).where(eq(lignesDevis.devisId, row.facture.devisId)).orderBy(lignesDevis.ordre)
    : [];

  return { ...row.facture, clientName: row.clientName ?? "—", devisNumber: row.devisNumber ?? undefined, lignes };
}

export async function createFactureFromDevis(devisId: string): Promise<Facture> {
  const [d] = await db.select().from(devis).where(eq(devis.id, devisId));
  if (!d) throw new Error("Devis introuvable");

  const number = await generateFactureNumber();
  const id = createId();

  // Échéance par défaut : 30 jours
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  const dueDateStr = dueDate.toISOString().split("T")[0];

  const [f] = await db
    .insert(factures)
    .values({
      id,
      number,
      clientId: d.clientId,
      devisId: d.id,
      totalHtCt: d.totalHtCt,
      totalTtcCt: d.totalTtcCt,
      tvaRate: d.tvaRate,
      dueDate: dueDateStr,
      status: "en_attente",
    })
    .returning();

  return f;
}

export async function createFactureManuelle(data: {
  clientId: string;
  totalHtCt: number;
  totalTtcCt: number;
  dueDate?: string;
}): Promise<Facture> {
  const number = await generateFactureNumber();
  const id = createId();

  const dueDate = data.dueDate ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  })();

  const [f] = await db
    .insert(factures)
    .values({ id, number, ...data, dueDate, status: "en_attente" })
    .returning();

  return f;
}

export async function updateFactureStatus(
  id: string,
  status: Facture["status"]
): Promise<Facture | null> {
  const patch: Partial<InferInsertModel<typeof factures>> = {
    status,
    updatedAt: new Date(),
  };
  if (status === "payée") patch.paidAt = new Date();

  const [f] = await db.update(factures).set(patch).where(eq(factures.id, id)).returning();
  return f ?? null;
}

export async function deleteFacture(id: string): Promise<void> {
  await db.delete(factures).where(eq(factures.id, id));
}

export const STATUS_FACTURE: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  payée:      { label: "Payée",      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  en_retard:  { label: "En retard",  color: "bg-red-500/10 text-red-400 border-red-500/30" },
  annulée:    { label: "Annulée",    color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
};
