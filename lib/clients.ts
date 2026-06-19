import { db } from "@/lib/db";
import { clients, devis, factures, interventions, savTickets, suivisPlanifies, leads, type Client, type NewClient } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { eq, desc, and, isNull } from "drizzle-orm";
import { randomBytes } from "crypto";

export type ClientActivity = Client & {
  devisList: (InferSelectModel<typeof devis>)[];
  facturesList: (InferSelectModel<typeof factures>)[];
  interventionsList: (InferSelectModel<typeof interventions>)[];
  savList: (InferSelectModel<typeof savTickets>)[];
  suivisList: (InferSelectModel<typeof suivisPlanifies>)[];
};

export type { Client };

export async function getClients(): Promise<Client[]> {
  return db.select().from(clients).where(isNull(clients.supprimeLe)).orderBy(desc(clients.createdAt));
}

// Action à faire par client (repère rouge) : entretien à relancer ou facture en retard.
export async function getClientActions(clientList: Client[]): Promise<Record<string, string>> {
  const today = new Date().toISOString().split("T")[0];
  const overdue = await db
    .select({ clientId: factures.clientId })
    .from(factures)
    .where(and(eq(factures.status, "en_retard"), isNull(factures.supprimeLe)));
  const overdueSet = new Set(overdue.map((f) => f.clientId).filter((x): x is string => !!x));

  const actions: Record<string, string> = {};
  for (const c of clientList) {
    if (c.prochainEntretienLe && c.prochainEntretienLe <= today) actions[c.id] = "Entretien à relancer";
    else if (overdueSet.has(c.id)) actions[c.id] = "Facture en retard";
  }
  return actions;
}

export async function getClientById(id: string): Promise<Client | null> {
  const [client] = await db.select().from(clients).where(eq(clients.id, id));
  return client ?? null;
}

export async function createClient(
  data: Omit<NewClient, "id" | "createdAt" | "updatedAt">
): Promise<Client> {
  const clientToken = data.clientToken ?? randomBytes(24).toString("hex");
  const [client] = await db.insert(clients).values({ ...data, clientToken }).returning();
  return client;
}

/** Crée un client à partir d'un prospect (lead) en recopiant TOUTES ses données.
 *  Réutilise le client existant si le lead a déjà été converti (lead.clientId). */
export async function createClientFromLead(leadId: string): Promise<Client | null> {
  const [lead] = await db.select().from(leads).where(eq(leads.id, leadId)).limit(1);
  if (!lead) return null;

  // Si déjà converti, on renvoie le client existant (idempotence)
  if (lead.clientId) {
    const existing = await getClientById(lead.clientId);
    if (existing) return existing;
  }

  const notes = [
    lead.notes,
    lead.project ? `Projet : ${lead.project}` : "",
    lead.equipementInteresse ? `Équipement : ${lead.equipementInteresse}` : "",
    lead.surfaceM2 ? `Surface : ${lead.surfaceM2} m²` : "",
    lead.message ? `Message : ${lead.message}` : "",
  ].filter(Boolean).join("\n");

  const client = await createClient({
    name: lead.name,
    phone: lead.phone,
    email: lead.email ?? undefined,
    address: lead.address ?? undefined,
    city: lead.location ?? undefined,
    notes: notes || undefined,
    leadId: lead.id,
  });

  // Lie le lead au client et le marque gagné (gagneLe = date de signature → CA du dashboard).
  await db.update(leads).set({
    clientId: client.id,
    status: "gagné",
    gagneLe: lead.gagneLe ?? new Date(),
    updatedAt: new Date(),
  }).where(eq(leads.id, lead.id));

  return client;
}

export async function updateClient(
  id: string,
  data: Partial<Omit<NewClient, "id" | "createdAt" | "updatedAt">>
): Promise<Client | null> {
  const [client] = await db
    .update(clients)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(clients.id, id))
    .returning();
  return client ?? null;
}

export async function deleteClient(id: string): Promise<void> {
  // Soft delete (cohérent avec leads/techniciens/contrats + évite les violations de
  // clés étrangères depuis factures/interventions/devis qui référencent le client).
  await db.update(clients).set({ supprimeLe: new Date() }).where(eq(clients.id, id));
}

export async function getClientActivity(id: string): Promise<ClientActivity | null> {
  const client = await getClientById(id);
  if (!client) return null;

  const [devisList, facturesList, interventionsList, savList, suivisList] = await Promise.all([
    db.select().from(devis).where(eq(devis.clientId, id)).orderBy(desc(devis.createdAt)),
    db.select().from(factures).where(eq(factures.clientId, id)).orderBy(desc(factures.createdAt)),
    db.select().from(interventions).where(eq(interventions.clientId, id)).orderBy(desc(interventions.createdAt)),
    db.select().from(savTickets).where(eq(savTickets.clientId, id)).orderBy(desc(savTickets.createdAt)),
    db.select().from(suivisPlanifies).where(eq(suivisPlanifies.clientId, id)).orderBy(desc(suivisPlanifies.datePrevue)),
  ]);

  return { ...client, devisList, facturesList, interventionsList, savList, suivisList };
}
