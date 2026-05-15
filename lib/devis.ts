import { db } from "@/lib/db";
import { devis, lignesDevis, clients } from "@/lib/db/schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
import { eq, desc, count } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export type Devis = InferSelectModel<typeof devis>;
export type LigneDevis = InferSelectModel<typeof lignesDevis>;
export type NewDevis = InferInsertModel<typeof devis>;
export type NewLigneDevis = InferInsertModel<typeof lignesDevis>;

export type DevisWithLignes = Devis & { lignes: LigneDevis[]; clientName?: string; clientEmail?: string | null };

export type LigneInput = {
  designation: string;
  quantite: number;
  prixUnitaireEuros: number; // saisie en euros, stocké en centimes
  tvaRate: string;           // "5.5", "10", "20"
};

export async function generateDevisNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const [{ value }] = await db.select({ value: count() }).from(devis);
  const n = Number(value) + 1;
  return `DEVIS-${year}-${String(n).padStart(3, "0")}`;
}

export async function getDevis(): Promise<(Devis & { clientName: string })[]> {
  const rows = await db
    .select({
      devis: devis,
      clientName: clients.name,
    })
    .from(devis)
    .leftJoin(clients, eq(devis.clientId, clients.id))
    .orderBy(desc(devis.createdAt));

  return rows.map((r) => ({ ...r.devis, clientName: r.clientName ?? "—" }));
}

export async function getDevisById(id: string): Promise<DevisWithLignes | null> {
  const [row] = await db
    .select({ devis: devis, clientName: clients.name, clientEmail: clients.email })
    .from(devis)
    .leftJoin(clients, eq(devis.clientId, clients.id))
    .where(eq(devis.id, id));

  if (!row) return null;

  const lignes = await db
    .select()
    .from(lignesDevis)
    .where(eq(lignesDevis.devisId, id))
    .orderBy(lignesDevis.ordre);

  return { ...row.devis, clientName: row.clientName ?? "—", clientEmail: row.clientEmail ?? null, lignes };
}

export async function createDevis(
  data: { clientId: string; description?: string; validUntil?: string },
  lignesInput: LigneInput[]
): Promise<DevisWithLignes> {
  const number = await generateDevisNumber();
  const id = createId();

  const lignesValues = lignesInput.map((l, i) => ({
    id: createId(),
    devisId: id,
    designation: l.designation,
    quantite: l.quantite,
    prixUnitaireCt: Math.round(l.prixUnitaireEuros * 100),
    tvaRate: l.tvaRate,
    ordre: i,
  }));

  const totalHtCt = lignesValues.reduce(
    (sum, l) => sum + l.quantite * l.prixUnitaireCt,
    0
  );
  const totalTtcCt = lignesValues.reduce((sum, l) => {
    const ligneHt = l.quantite * l.prixUnitaireCt;
    return sum + Math.round(ligneHt * (1 + Number(l.tvaRate) / 100));
  }, 0);

  const [d] = await db
    .insert(devis)
    .values({
      id,
      number,
      clientId: data.clientId,
      description: data.description ?? null,
      validUntil: data.validUntil ?? null,
      totalHtCt,
      totalTtcCt,
      status: "brouillon",
    })
    .returning();

  const lignes =
    lignesValues.length > 0
      ? await db.insert(lignesDevis).values(lignesValues).returning()
      : [];

  return { ...d, lignes };
}

export async function updateDevisStatus(
  id: string,
  status: Devis["status"]
): Promise<Devis | null> {
  const [d] = await db
    .update(devis)
    .set({ status, updatedAt: new Date() })
    .where(eq(devis.id, id))
    .returning();
  return d ?? null;
}

export async function deleteDevis(id: string): Promise<void> {
  await db.delete(lignesDevis).where(eq(lignesDevis.devisId, id));
  await db.delete(devis).where(eq(devis.id, id));
}

// Helpers d'affichage
export function centimesToEuros(ct: number | null): string {
  if (ct == null) return "0,00 €";
  return (ct / 100).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export const STATUS_DEVIS: Record<
  string,
  { label: string; color: string }
> = {
  brouillon:  { label: "Brouillon",  color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
  envoyé:     { label: "Envoyé",     color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  accepté:    { label: "Accepté",    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  refusé:     { label: "Refusé",     color: "bg-red-500/10 text-red-400 border-red-500/30" },
  expiré:     { label: "Expiré",     color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
};
