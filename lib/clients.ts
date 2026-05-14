import { db } from "@/lib/db";
import { clients, type Client, type NewClient } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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
  const [client] = await db.insert(clients).values(data).returning();
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
