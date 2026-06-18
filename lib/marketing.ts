import { db } from "@/lib/db";
import { clients, leads } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

export type MarketingContact = {
  id: string;
  type: "prospect" | "client";
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  consentement: boolean;          // consentement marketing (démarchage)
  createdAt: Date | string;
};

/** Base de contacts pour campagnes : prospects (leads non convertis) + clients.
 *  Le consentement marketing vit sur le lead ; pour un client il est résolu via
 *  son lead d'origine (client.leadId). */
export async function getMarketingContacts(): Promise<MarketingContact[]> {
  const [clientRows, prospectRows] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        email: clients.email,
        city: clients.city,
        createdAt: clients.createdAt,
        consentement: leads.consentementMarketing,
      })
      .from(clients)
      .leftJoin(leads, eq(clients.leadId, leads.id))
      .where(isNull(clients.supprimeLe)),
    db
      .select({
        id: leads.id,
        name: leads.name,
        phone: leads.phone,
        email: leads.email,
        city: leads.location,
        createdAt: leads.createdAt,
        consentement: leads.consentementMarketing,
      })
      .from(leads)
      .where(and(isNull(leads.clientId), isNull(leads.supprimeLe))),
  ]);

  const contacts: MarketingContact[] = [
    ...clientRows.map((r) => ({
      id: r.id, type: "client" as const, name: r.name, phone: r.phone,
      email: r.email, city: r.city, consentement: r.consentement === true,
      createdAt: r.createdAt,
    })),
    ...prospectRows.map((r) => ({
      id: r.id, type: "prospect" as const, name: r.name, phone: r.phone,
      email: r.email, city: r.city, consentement: r.consentement === true,
      createdAt: r.createdAt,
    })),
  ];

  return contacts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
