import { db } from "@/lib/db";
import { clients, devis, factures, interventions, savTickets, suivisPlanifies, leads, type Client, type NewClient } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { eq, desc, and, isNull, ilike, or, sql, count, type SQL } from "drizzle-orm";
import { randomBytes } from "crypto";
import { createChantier, getChantierByLead } from "@/lib/chantiers";
import { logError } from "@/lib/observability";
import { formatQualification } from "@/lib/qualification";
import { todayParisISO } from "@/lib/paris-time";
import { Resend } from "resend";
import { mailRecipient } from "@/lib/mail";
import { escapeHtml } from "@/lib/escape-html";

const PROJECT_LABEL: Record<string, string> = {
  installation: "Installation", entretien: "Entretien", depannage: "Dépannage",
  "contrat-pro": "Contrat pro", autre: "Chantier",
};

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

export type ClientsPage = { items: Client[]; total: number; page: number; pageSize: number };

/** Liste paginée + recherche serveur (nom / téléphone / ville). Évite de charger
 *  toutes les lignes : tient à fort volume. */
export async function getClientsPaginated(opts: { search?: string; page?: number; limit?: number } = {}): Promise<ClientsPage> {
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts.limit ?? 50)));
  const offset = (page - 1) * pageSize;
  const q = (opts.search ?? "").trim();
  const filters: SQL[] = [isNull(clients.supprimeLe)];
  if (q) {
    const like = `%${q}%`;
    filters.push(or(ilike(clients.name, like), ilike(clients.phone, like), ilike(clients.city, like), ilike(clients.address, like), ilike(clients.email, like), ilike(clients.representant, like))!);
  }
  const where = and(...filters);
  const [items, totalRows] = await Promise.all([
    db.select().from(clients).where(where).orderBy(desc(clients.createdAt)).limit(pageSize).offset(offset),
    db.select({ value: count() }).from(clients).where(where),
  ]);
  return { items, total: Number(totalRows[0]?.value ?? 0), page, pageSize };
}

/** Statistiques globales du carnet (justes quelle que soit la page affichée). */
export async function getClientsStats(): Promise<{ total: number; withEmail: number; villes: number }> {
  const [row] = await db.select({
    total: sql<number>`count(*)::int`,
    withEmail: sql<number>`count(${clients.email})::int`,
    villes: sql<number>`count(distinct ${clients.city})::int`,
  }).from(clients).where(isNull(clients.supprimeLe));
  return { total: row?.total ?? 0, withEmail: row?.withEmail ?? 0, villes: row?.villes ?? 0 };
}

// Action à faire par client (repère rouge) : entretien à relancer ou facture en retard.
export async function getClientActions(clientList: Client[]): Promise<Record<string, string>> {
  const today = todayParisISO();
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
    formatQualification(lead.qualification), // guide de qualification (vide si non rempli)
  ].filter(Boolean).join("\n");

  // Pro avec entreprise renseignée : le client porte la raison sociale (name) et le contact
  // saisi sur le prospect devient le représentant. Sinon le name du prospect est repris tel quel.
  const isProAvecEntreprise = lead.typeClient === "professionnel" && !!lead.entreprise?.trim();
  const client = await createClient({
    typeClient: lead.typeClient, // particulier / professionnel hérité du prospect
    name: isProAvecEntreprise ? lead.entreprise!.trim() : lead.name,
    representant: isProAvecEntreprise ? lead.name : undefined, // le contact du prospect = le représentant
    phone: lead.phone,
    email: lead.email ?? undefined,
    address: lead.address ?? undefined,
    city: lead.location ?? undefined,
    siret: lead.siren?.trim() || lead.qualification?.siret?.trim() || undefined, // SIREN saisi, sinon SIRET de la qualification
    notes: notes || undefined,
    leadId: lead.id,
  });

  // Lie le lead au client et le marque gagné (gagneLe = date de signature → CA du dashboard).
  await db.update(leads).set({
    clientId: client.id,
    status: "gagné",
    gagneLe: lead.gagneLe ?? new Date(),
    version: sql`${leads.version} + 1`,
    updatedAt: new Date(),
  }).where(eq(leads.id, lead.id));

  // Chantier créé à la signature du devis (= passage en "gagné"). Idempotent (1 par prospect).
  // NON bloquant volontairement : un échec ici ne doit pas faire échouer la conversion en
  // client (action critique). On le remonte via logError (Sentry) pour pouvoir le rattraper
  // au besoin avec scripts/backfill-chantiers.ts.
  try {
    if (!(await getChantierByLead(lead.id))) {
      const nom = `${PROJECT_LABEL[lead.project ?? ""] ?? "Chantier"}, ${client.name}`;
      await createChantier({ clientId: client.id, leadId: lead.id, nom, montantCt: lead.montantDevisCt ?? null });
    }
  } catch (e) {
    logError("chantier.autoCreate", e, { leadId: lead.id, clientId: client.id });
  }

  // E-mail de bienvenue : ouverture de l'espace client (suivi du chantier par lien simple).
  // Non bloquant : un échec d'envoi ne doit pas empêcher la conversion.
  if (client.email) {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
      const link = `${baseUrl}/suivi/${client.clientToken}`;
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "ClimExpert <noreply@climexpert.fr>",
        to: mailRecipient(client.email),
        subject: "Bienvenue chez ClimExpert, votre espace client est ouvert",
        html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0f172a;">
          <h2 style="color:#0284c7;">Merci pour votre confiance, ${escapeHtml(client.name)} !</h2>
          <p>Votre devis est signé : votre <strong>espace client</strong> est ouvert. Vous y suivez l'avancement de votre chantier en temps réel, de la commande du matériel à la mise en service.</p>
          <p><a href="${link}" style="background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Accéder à mon espace client</a></p>
          <p style="color:#64748b;font-size:13px;">Prochaine étape : dès réception de votre acompte (30 %), nous commandons le matériel dimensionné pour votre projet.</p>
          <p style="color:#64748b;font-size:12px;">Lien personnel, conservez cet e-mail pour revenir à votre espace quand vous voulez.</p>
          <p style="color:#94a3b8;font-size:12px;">L'équipe ClimExpert &middot; contact@climexpert.fr</p>
        </div>`,
      });
    } catch (e) {
      logError("client.welcome.email", e, { clientId: client.id });
    }
  }

  return client;
}

export async function updateClient(
  id: string,
  data: Partial<Omit<NewClient, "id" | "createdAt" | "updatedAt">>
): Promise<Client | null> {
  const [client] = await db
    .update(clients)
    .set({ ...data, version: sql`${clients.version} + 1` as unknown as number, updatedAt: new Date() })
    .where(eq(clients.id, id))
    .returning();
  return client ?? null;
}

export async function deleteClient(id: string): Promise<void> {
  // Soft delete (cohérent avec leads/techniciens/contrats + évite les violations de
  // clés étrangères depuis factures/interventions/devis qui référencent le client).
  await db.update(clients).set({ supprimeLe: new Date(), version: sql`${clients.version} + 1` }).where(eq(clients.id, id));
}

export async function getClientActivity(id: string): Promise<ClientActivity | null> {
  // Tout en parallèle : les requêtes liées utilisent l'id du paramètre, pas la fiche client,
  // donc la lecture du client n'a pas besoin d'être faite avant (un aller-retour DB en moins).
  const [client, devisList, facturesList, interventionsList, savList, suivisList] = await Promise.all([
    getClientById(id),
    db.select().from(devis).where(eq(devis.clientId, id)).orderBy(desc(devis.createdAt)),
    db.select().from(factures).where(and(eq(factures.clientId, id), isNull(factures.supprimeLe))).orderBy(desc(factures.createdAt)),
    db.select().from(interventions).where(eq(interventions.clientId, id)).orderBy(desc(interventions.createdAt)),
    db.select().from(savTickets).where(eq(savTickets.clientId, id)).orderBy(desc(savTickets.createdAt)),
    db.select().from(suivisPlanifies).where(eq(suivisPlanifies.clientId, id)).orderBy(desc(suivisPlanifies.datePrevue)),
  ]);
  if (!client) return null;

  return { ...client, devisList, facturesList, interventionsList, savList, suivisList };
}
