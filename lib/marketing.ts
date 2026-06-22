import { db } from "@/lib/db";
import { clients, leads, contratsEntretien, interventions } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";

export type MarketingContact = {
  id: string;
  type: "prospect" | "client";
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  arrondissement: number | null;  // arrondissement parisien déduit (1-20) si applicable
  consentement: boolean;          // consentement marketing (démarchage)
  aContrat: boolean;              // a un contrat d'entretien
  aInstallation: boolean;         // a eu une installation
  statut: string | null;          // statut prospect ("perdu"…) ; "client" pour un client
  pasDeSuite: boolean;            // prospect sans suite (perdu / pas de réponse)
  typeClient: string | null;      // particulier / professionnel / sous_traitance
  createdAt: Date | string;
};

/** Déduit l'arrondissement parisien depuis une ville/CP libre ("75015", "Paris 15e"…). */
function parisArrondissement(city: string | null): number | null {
  if (!city) return null;
  const cp = city.match(/\b75(\d{3})\b/);
  if (cp) {
    const n = parseInt(cp[1], 10);
    if (n >= 1 && n <= 20) return n;
    if (n === 116) return 16;
  }
  const ord = city.match(/(\d{1,2})\s*(?:er|ème|eme|è|e|arr)/i);
  if (ord) { const n = parseInt(ord[1], 10); if (n >= 1 && n <= 20) return n; }
  return null;
}

/** Base de contacts pour campagnes : prospects (leads non convertis) + clients.
 *  Le consentement marketing vit sur le lead ; pour un client il est résolu via
 *  son lead d'origine (client.leadId). */
export async function getMarketingContacts(): Promise<MarketingContact[]> {
  const [clientRows, prospectRows, contractRows, installRows] = await Promise.all([
    db
      .select({
        id: clients.id,
        name: clients.name,
        phone: clients.phone,
        email: clients.email,
        city: clients.city,
        typeClient: clients.typeClient,
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
        status: leads.status,
        typeClient: leads.typeClient,
        createdAt: leads.createdAt,
        consentement: leads.consentementMarketing,
      })
      .from(leads)
      .where(and(isNull(leads.clientId), isNull(leads.supprimeLe))),
    db.select({ clientId: contratsEntretien.clientId }).from(contratsEntretien),
    db.select({ clientId: interventions.clientId }).from(interventions)
      .where(and(eq(interventions.type, "installation"), isNull(interventions.supprimeLe), ne(interventions.status, "annulée"))),
  ]);

  const withContract = new Set(contractRows.map((r) => r.clientId).filter(Boolean) as string[]);
  const withInstall = new Set(installRows.map((r) => r.clientId).filter(Boolean) as string[]);

  const contacts: MarketingContact[] = [
    ...clientRows.map((r) => ({
      id: r.id, type: "client" as const, name: r.name, phone: r.phone,
      email: r.email, city: r.city, arrondissement: parisArrondissement(r.city),
      consentement: r.consentement === true,
      aContrat: withContract.has(r.id), aInstallation: withInstall.has(r.id),
      statut: "client", pasDeSuite: false, typeClient: r.typeClient,
      createdAt: r.createdAt,
    })),
    ...prospectRows.map((r) => ({
      id: r.id, type: "prospect" as const, name: r.name, phone: r.phone,
      email: r.email, city: r.city, arrondissement: parisArrondissement(r.city),
      consentement: r.consentement === true,
      aContrat: false, aInstallation: false,
      statut: r.status, pasDeSuite: ["perdu", "pas_de_reponse"].includes(r.status),
      typeClient: r.typeClient,
      createdAt: r.createdAt,
    })),
  ];

  return contacts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}
