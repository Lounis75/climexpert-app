import { db } from "@/lib/db";
import { clients, devis, factures, interventions, savTickets, suivisPlanifies, type Client, type NewClient } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { eq, desc } from "drizzle-orm";
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
  return db.select().from(clients).orderBy(desc(clients.createdAt));
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
  await db.delete(clients).where(eq(clients.id, id));
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
