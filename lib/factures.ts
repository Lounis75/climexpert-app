import { db } from "@/lib/db";
import { factures, devis, clients, lignesDevis } from "@/lib/db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { eq, desc, and, lt, ne, isNull, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { centimesToEuros } from "@/lib/devis";
import { todayParisISO, addDaysParisISO } from "@/lib/paris-time";
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
  // Compteur atomique (séquence Postgres, comme les devis) : l'ancien COUNT(*)+1 générait un
  // numéro déjà pris après une suppression (violation d'unicité = facturation bloquée) et le
  // même numéro en cas de créations simultanées.
  const res = await db.execute(sql`SELECT nextval('facture_number_seq') AS n`);
  const rows = (Array.isArray(res) ? res : (res as { rows?: unknown[] }).rows) ?? [];
  const n = Number((rows[0] as { n: number | string } | undefined)?.n ?? 1);
  return `FACT-${year}-${String(n).padStart(3, "0")}`;
}

export async function markOverdueFactures(): Promise<void> {
  const today = todayParisISO();

  // Récupérer les factures qui vont passer en retard pour créer les notifications
  const toMark = await db
    .select({ id: factures.id, number: factures.number })
    .from(factures)
    .where(and(eq(factures.status, "en_attente"), lt(factures.dueDate, today), isNull(factures.supprimeLe)));

  if (toMark.length === 0) return;

  await db
    .update(factures)
    .set({ status: "en_retard", updatedAt: new Date() })
    .where(and(eq(factures.status, "en_attente"), lt(factures.dueDate, today), isNull(factures.supprimeLe)));

  // Notifications (fire-and-forget)
  for (const f of toMark) {
    createNotification({
      type: "facture_en_retard",
      titre: `Facture en retard, ${f.number}`,
      refType: "facture",
      refId: f.id,
    }).catch(() => {});
  }
}

export async function getFactures(): Promise<FactureWithRefs[]> {
  markOverdueFactures().catch(() => {});
  const rows = await db
    .select({
      facture: factures,
      clientName: clients.name,
      devisNumber: devis.number,
    })
    .from(factures)
    .leftJoin(clients, eq(factures.clientId, clients.id))
    .leftJoin(devis, eq(factures.devisId, devis.id))
    .where(isNull(factures.supprimeLe))
    .orderBy(desc(factures.createdAt));

  return rows.map((r) => ({
    ...r.facture,
    clientName: r.clientName ?? "-",
    devisNumber: r.devisNumber ?? undefined,
  }));
}

export async function getFactureById(id: string): Promise<FactureWithRefs | null> {
  markOverdueFactures().catch(() => {});
  const [row] = await db
    .select({
      facture: factures,
      clientName: clients.name,
      devisNumber: devis.number,
    })
    .from(factures)
    .leftJoin(clients, eq(factures.clientId, clients.id))
    .leftJoin(devis, eq(factures.devisId, devis.id))
    .where(and(eq(factures.id, id), isNull(factures.supprimeLe)));

  if (!row) return null;

  const lignes = row.facture.devisId
    ? await db.select().from(lignesDevis).where(eq(lignesDevis.devisId, row.facture.devisId)).orderBy(lignesDevis.ordre)
    : [];

  return { ...row.facture, clientName: row.clientName ?? "-", devisNumber: row.devisNumber ?? undefined, lignes };
}

export async function createFactureFromDevis(devisId: string): Promise<Facture> {
  const [d] = await db.select().from(devis).where(eq(devis.id, devisId));
  if (!d) throw new Error("Devis introuvable");
  // Une facture exige un client. Un devis "prospect" doit d'abord être signé
  // (la signature crée le client), ce qui renseigne clientId.
  if (!d.clientId) throw new Error("Devis sans client : faites-le signer avant de facturer.");

  // Idempotence : si une facture (non annulée) existe déjà pour ce devis, la renvoyer
  // au lieu d'en créer une seconde (anti double-clic / retry → double facturation).
  const [existing] = await db
    .select()
    .from(factures)
    .where(and(eq(factures.devisId, devisId), ne(factures.status, "annulée"), isNull(factures.supprimeLe)))
    .limit(1);
  if (existing) return existing;

  const number = await generateFactureNumber();
  const id = createId();

  // Échéance par défaut : 30 jours
  const dueDateStr = addDaysParisISO(30);

  // Taux de TVA effectif déduit des montants (le champ d'en-tête du devis n'est pas
  // fiable). Évite d'afficher "TVA 5,5%" sur une facture dont le TTC correspond à 20%.
  const htCt = d.totalHtCt ?? 0;
  const ttcCt = d.totalTtcCt ?? 0;
  const effectiveTva = htCt > 0
    ? (Math.round((ttcCt / htCt - 1) * 10000) / 100).toFixed(2)
    : d.tvaRate;

  const [f] = await db
    .insert(factures)
    .values({
      id,
      number,
      clientId: d.clientId,
      devisId: d.id,
      totalHtCt: d.totalHtCt,
      totalTtcCt: d.totalTtcCt,
      tvaRate: effectiveTva,
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

  const dueDate = data.dueDate ?? addDaysParisISO(30);

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

// Soft delete : une facture émise ne disparaît jamais physiquement (séquentialité comptable,
// possibilité d'audit). Toutes les lectures filtrent supprimeLe.
export async function deleteFacture(id: string): Promise<void> {
  await db.update(factures).set({ supprimeLe: new Date(), updatedAt: new Date() }).where(eq(factures.id, id));
}

export const STATUS_FACTURE: Record<string, { label: string; color: string }> = {
  en_attente: { label: "En attente", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  payée:      { label: "Payée",      color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  en_retard:  { label: "En retard",  color: "bg-red-500/10 text-red-400 border-red-500/30" },
  annulée:    { label: "Annulée",    color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
};
