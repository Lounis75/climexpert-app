import { db } from "@/lib/db";
import { leads, interventions, suivis, techniciens, devisEnvois, clients, type Lead, type NewLead } from "@/lib/db/schema";
import { eq, desc, isNull, and, inArray, notInArray, ne, isNotNull, asc, ilike, or, count, sql, type SQL, type AnyColumn } from "drizzle-orm";
import { qualifTokenValid } from "@/lib/qualif";
import { getTableColumns } from "drizzle-orm";

export type LeadStatus = "nouveau" | "pas_de_reponse" | "contacté" | "devis_envoyé" | "gagné" | "perdu";
export type LeadSource = "alex" | "formulaire" | "téléphone" | "whatsapp" | "autre";

export type { Lead };

export type RendezVous = {
  id: string;
  name: string;
  phone: string;
  rdvDate: Date | null;
  location: string | null;
  address: string | null;
  project: string | null;
  status: string;
  commercialId: string | null;
  commercialName: string | null;
};

/** Prospect ACTIF portant ce numéro de téléphone (comparaison sur les 9 derniers chiffres :
 *  insensible aux espaces, points, +33/0...). Utilisé par le chat public pour METTRE À JOUR la
 *  fiche existante au lieu de créer un doublon quand un client reparle à Alex. */
export async function findActiveLeadByPhone(phone: string): Promise<Lead | null> {
  const digits = (phone ?? "").replace(/\D/g, "").slice(-9);
  if (digits.length < 9) return null;
  const [row] = await db.select().from(leads)
    .where(and(
      isNull(leads.supprimeLe), isNull(leads.archiveLe),
      sql`right(regexp_replace(${leads.phone}, '\\D', '', 'g'), 9) = ${digits}`,
    ))
    .orderBy(desc(leads.createdAt))
    .limit(1);
  return row ?? null;
}

/** Détecte un prospect actif (non supprimé) avec le même téléphone + nom (insensible
 *  à la casse), pour empêcher les doublons saisis manuellement. */
export async function findActiveLeadByNamePhone(name: string, phone: string): Promise<Lead | null> {
  const digits = (phone ?? "").replace(/\D/g, "").slice(-9);
  if (digits.length < 9) return null;
  const rows = await db.select().from(leads)
    .where(and(sql`right(regexp_replace(${leads.phone}, '\D', '', 'g'), 9) = ${digits}`, isNull(leads.supprimeLe), isNull(leads.archiveLe)));
  const target = name.trim().toLowerCase();
  return rows.find((r) => r.name.trim().toLowerCase() === target) ?? null;
}

/** Rendez-vous commerciaux (« RDV pris ») = prospects avec une date de RDV.
 *  Admin : tous (opts vide). Commercial : passer commercialId pour ne voir que les siens. */
export async function getRendezVous(opts?: { commercialId?: string }): Promise<RendezVous[]> {
  // On exclut les prospects supprimés ET archivés : un RDV rattaché à une fiche corbeille/archivée
  // ne doit plus apparaître dans l'agenda commercial (sinon fantômes dans le planning).
  const conds = [isNotNull(leads.rdvDate), ne(leads.status, "perdu"), isNull(leads.supprimeLe), isNull(leads.archiveLe)];
  if (opts?.commercialId) conds.push(eq(leads.commercialId, opts.commercialId));
  const rows = await db
    .select({
      id: leads.id, name: leads.name, phone: leads.phone, rdvDate: leads.rdvDate, location: leads.location,
      address: leads.address, project: leads.project, status: leads.status,
      commercialId: leads.commercialId, commercialName: techniciens.name,
    })
    .from(leads)
    .leftJoin(techniciens, eq(leads.commercialId, techniciens.id))
    .where(and(...conds))
    .orderBy(asc(leads.rdvDate));
  return rows.map((r) => ({ ...r, commercialName: r.commercialName ?? null }));
}

// Date de la dernière activité (échange logué) par prospect → « dernière activité » sur la carte.
export async function getLastActivityByLead(leadIds: string[]): Promise<Record<string, string>> {
  if (leadIds.length === 0) return {};
  const rows = await db
    .select({ leadId: suivis.leadId, createdAt: suivis.createdAt })
    .from(suivis)
    .where(inArray(suivis.leadId, leadIds));
  const map: Record<string, string> = {};
  for (const r of rows) {
    if (!r.leadId) continue;
    const t = new Date(r.createdAt).toISOString();
    if (!map[r.leadId] || t > map[r.leadId]) map[r.leadId] = t;
  }
  return map;
}

// Prospects « passés en production » : gagnés ET dont une intervention liée est planifiée
// (date + technicien affectés). Ils sortent du Kanban CRM (le pilotage vit dans Terrain).
export async function getEnProductionLeadIds(leadList: Lead[]): Promise<Set<string>> {
  const clientIds = leadList
    .filter((l) => l.status === "gagné" && l.clientId)
    .map((l) => l.clientId as string);
  if (clientIds.length === 0) return new Set();

  const rows = await db
    .select({ clientId: interventions.clientId })
    .from(interventions)
    .where(and(
      inArray(interventions.clientId, clientIds),
      isNotNull(interventions.scheduledAt),
      isNotNull(interventions.technicienId),
      ne(interventions.status, "annulée"),
      isNull(interventions.supprimeLe),
    ));

  const prodClients = new Set(rows.map((r) => r.clientId).filter((x): x is string => !!x));
  return new Set(leadList.filter((l) => l.clientId && prodClients.has(l.clientId)).map((l) => l.id));
}

export async function createLead(
  data: Omit<NewLead, "id" | "createdAt" | "updatedAt" | "status">
): Promise<Lead> {
  const [lead] = await db.insert(leads).values({ ...data, statutChangeLe: new Date() }).returning();
  return lead;
}

export async function getLeads(): Promise<Lead[]> {
  return db.select().from(leads).where(isNull(leads.supprimeLe)).orderBy(desc(leads.createdAt));
}

// Prospects ARCHIVÉS (perdus sortis du Kanban par le cron après 7 j). Ils restent en base pour un
// éventuel recontact : cette liste permet de les revoir et de les ré-ouvrir depuis l'interface.
export async function getArchivedLeads(opts?: { limit?: number; offset?: number }): Promise<Lead[]> {
  const limit = Math.min(opts?.limit ?? 50, 200);
  const offset = opts?.offset ?? 0;
  return db.select().from(leads)
    .where(and(isNull(leads.supprimeLe), isNotNull(leads.archiveLe)))
    .orderBy(desc(leads.archiveLe))
    .limit(limit).offset(offset);
}

// Ré-ouvre un prospect archivé : on le sort des archives et on le repositionne en « Contacté »
// (on reprend le fil), avec une date de statut fraîche pour ne pas le ré-archiver aussitôt.
export async function restoreArchivedLead(id: string): Promise<Lead | null> {
  const [lead] = await db.update(leads).set({
    archiveLe: null, status: "contacté", motifPerdu: null,
    statutChangeLe: new Date(), relanceNotifieeLe: null,
    version: sql`${leads.version} + 1`, updatedAt: new Date(),
  }).where(and(eq(leads.id, id), isNotNull(leads.archiveLe), isNull(leads.supprimeLe))).returning();
  return lead ?? null;
}

const STATUS_LIST: LeadStatus[] = ["nouveau", "contacté", "devis_envoyé", "gagné", "perdu"];

/** Ordre d'une colonne du Kanban. La colonne "Nouveau" est une file d'appels : le plus ancien
 *  (jamais appelé) en haut ; un « pas de réponse » met à jour dernierAppelLe et renvoie le
 *  prospect en bas. Les autres colonnes restent en plus récent d'abord. */
function orderForStatus(st: LeadStatus) {
  return st === "nouveau"
    ? sql`COALESCE(${leads.dernierAppelLe}, ${leads.createdAt}) ASC`
    : desc(leads.createdAt);
}

/** Ensemble des prospects « en production » (gagnés AVEC une intervention planifiée
 *  date+technicien) → masqués du Kanban. Calculé en une requête (pas par lot). */
export async function getEnProductionLeadIdSet(): Promise<Set<string>> {
  const rows = await db.select({ id: leads.id })
    .from(leads)
    .innerJoin(interventions, eq(leads.clientId, interventions.clientId))
    .where(and(
      eq(leads.status, "gagné"),
      isNotNull(leads.clientId),
      isNotNull(interventions.scheduledAt),
      isNotNull(interventions.technicienId),
      ne(interventions.status, "annulée"),
      isNull(interventions.supprimeLe),
      isNull(leads.supprimeLe),
    ));
  return new Set(rows.map((r) => r.id));
}

/** Prospect rattaché à un lien personnel de qualification Alex (portail public /qualif/[token]). */
export async function getLeadByQualifToken(token: string): Promise<Lead | null> {
  const [l] = await db.select().from(leads).where(and(eq(leads.qualifToken, token), isNull(leads.supprimeLe))).limit(1);
  if (!l) return null;
  return qualifTokenValid(l.qualifTokenLe) ? l : null; // lien expiré = introuvable
}

/** Montant du devis (centimes) par clientId, pour afficher le montant sur les cartes « à affecter ». */
export async function getMontantsDevisByClientIds(clientIds: string[]): Promise<Record<string, number>> {
  if (clientIds.length === 0) return {};
  const rows = await db.select({ clientId: leads.clientId, montantCt: leads.montantDevisCt })
    .from(leads)
    .where(and(inArray(leads.clientId, clientIds), isNull(leads.supprimeLe)));
  const out: Record<string, number> = {};
  for (const r of rows) if (r.clientId && r.montantCt != null && out[r.clientId] == null) out[r.clientId] = r.montantCt;
  return out;
}

/** Données du Kanban : jusqu'à `cap` prospects les plus récents PAR colonne (statut),
 *  + le total réel par statut. Évite de charger toute la table. */
// Colonnes LOURDES exclues du chargement du Kanban : elles ne servent qu'au cockpit (détail),
// pas aux cartes. Les transcrits Alex (notes/notesAlex, jusqu'à plusieurs Ko) et les JSON
// (qualification, chiffrageBrouillon, taches) faisaient un payload de 1 à 3 Mo à chaque
// ouverture de la page la plus utilisée. Elles sont chargées à l'ouverture d'une fiche
// (GET /api/admin/leads/[id]).
const HEAVY_LEAD_FIELDS = {
  notes: null, notesAlex: null, message: null, qualification: null, taches: null,
  photosUrls: null, piecesJointes: null, noteEpinglee: null, chiffrageBrouillon: null,
} as const;

function boardLeadColumns() {
  const { notes, notesAlex, message, qualification, taches, photosUrls, piecesJointes, noteEpinglee, chiffrageBrouillon, ...rest } = getTableColumns(leads);
  return rest;
}
function toBoardLead(row: Record<string, unknown>): Lead {
  return { ...row, ...HEAVY_LEAD_FIELDS } as Lead;
}

export async function getLeadsBoard(cap = 50): Promise<{ leads: Lead[]; counts: Record<string, number>; enProductionCount: number }> {
  const enProd = await getEnProductionLeadIdSet();
  const enProdArr = [...enProd];

  const countRows = await db.select({ status: leads.status, value: count() })
    .from(leads).where(and(isNull(leads.supprimeLe), isNull(leads.archiveLe))).groupBy(leads.status);
  const counts: Record<string, number> = {};
  for (const r of countRows) counts[r.status] = Number(r.value);
  counts["gagné"] = Math.max(0, (counts["gagné"] ?? 0) - enProd.size); // les "en production" sont masqués

  const cols = boardLeadColumns();
  const perStatus = await Promise.all(STATUS_LIST.map((st) => {
    const conds: SQL[] = [isNull(leads.supprimeLe), isNull(leads.archiveLe), eq(leads.status, st)];
    if (st === "gagné" && enProdArr.length) conds.push(notInArray(leads.id, enProdArr));
    return db.select(cols).from(leads).where(and(...conds)).orderBy(orderForStatus(st)).limit(cap);
  }));
  return { leads: perStatus.flat().map(toBoardLead), counts, enProductionCount: enProd.size };
}

/** « Charger plus » d'une colonne : prospects suivants d'un statut donné. */
export async function getLeadsByStatusPaged(opts: { status: LeadStatus; offset: number; limit: number }): Promise<Lead[]> {
  const conds: SQL[] = [isNull(leads.supprimeLe), isNull(leads.archiveLe), eq(leads.status, opts.status)];
  if (opts.status === "gagné") {
    const enProd = [...await getEnProductionLeadIdSet()];
    if (enProd.length) conds.push(notInArray(leads.id, enProd));
  }
  return db.select().from(leads).where(and(...conds)).orderBy(orderForStatus(opts.status))
    .limit(Math.min(100, Math.max(1, opts.limit))).offset(Math.max(0, opts.offset));
}

/** Vue Liste paginée + recherche serveur (nom / téléphone / ville). */
export async function getLeadsPaginated(opts: { search?: string; page?: number; limit?: number } = {}): Promise<{ items: Lead[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, Math.floor(opts.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(opts.limit ?? 50)));
  const offset = (page - 1) * pageSize;
  const q = (opts.search ?? "").trim();
  const filters: SQL[] = [isNull(leads.supprimeLe), isNull(leads.archiveLe)];
  // Exclut les « en production » (gagnés + intervention planifiée) → cohérent avec le
  // Kanban : la recherche/charger-plus ne doit pas les réinjecter dans les colonnes.
  const enProd = [...await getEnProductionLeadIdSet()];
  if (enProd.length) filters.push(notInArray(leads.id, enProd));
  if (q) {
    // Recherche tolérante : insensible à la casse ET aux accents (translate côté colonne, dépliage
    // NFD côté requête), e-mail inclus, et téléphone comparé sur les chiffres seuls (« 0612345678 »
    // trouve « 06 12 34 56 78 » et inversement).
    const qFold = `%${q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")}%`;
    const foldCol = (col: AnyColumn) => sql`translate(lower(${col}), 'àâäáéèêëïîíìôöóòûüúùçñ', 'aaaaeeeeiiiioooouuuucn')`;
    const conds: SQL[] = [
      sql`${foldCol(leads.name)} like ${qFold}`,
      sql`${foldCol(leads.location)} like ${qFold}`,
      sql`${foldCol(leads.address)} like ${qFold}`,
      sql`${foldCol(leads.entreprise)} like ${qFold}`,
      sql`lower(${leads.email}) like ${`%${q.toLowerCase()}%`}`,
    ];
    const digits = q.replace(/\D/g, "");
    conds.push(
      digits.length >= 3
        ? sql`regexp_replace(${leads.phone}, '\D', '', 'g') like ${`%${digits}%`}`
        : sql`${foldCol(leads.phone)} like ${qFold}`,
    );
    filters.push(or(...conds)!);
  }
  const where = and(...filters);
  const [items, totalRows] = await Promise.all([
    db.select().from(leads).where(where).orderBy(desc(leads.createdAt)).limit(pageSize).offset(offset),
    db.select({ value: count() }).from(leads).where(where),
  ]);
  return { items, total: Number(totalRows[0]?.value ?? 0), page, pageSize };
}

export async function getLeadById(id: string): Promise<Lead | null> {
  const [lead] = await db.select().from(leads).where(eq(leads.id, id));
  return lead ?? null;
}

export async function updateLead(
  id: string,
  data: Partial<Pick<NewLead, "status" | "notes" | "email" | "location" | "address" | "project" | "name" | "phone" | "clientId" | "commercialId" | "consentementMarketing" | "consentementLe" | "montantDevisCt" | "prochaineEtape" | "rdvDate" | "visiteClientLe" | "dateSouhaiteeIntervention" | "prochaineActionLe" | "favori" | "qualification" | "taches" | "typeClient" | "entreprise" | "siren" | "motifPerdu">>,
  expectedVersion?: number,
): Promise<Lead | null> {
  // Verrou optimiste : si expectedVersion est fourni, la mise à jour n'a lieu que si
  // la version en base correspond (sinon quelqu'un a modifié entre-temps → 0 ligne).
  const conds = [eq(leads.id, id)];
  if (typeof expectedVersion === "number") conds.push(eq(leads.version, expectedVersion));
  // Au changement de statut : on date le passage (cycle de vie) et on remet à zéro le
  // verrou anti-doublon des rappels (un nouveau statut = un nouveau compteur).
  const statusChange = data.status !== undefined ? { statutChangeLe: new Date(), relanceNotifieeLe: null } : {};
  const [lead] = await db
    .update(leads)
    .set({ ...data, ...statusChange, version: sql`${leads.version} + 1`, updatedAt: new Date() })
    .where(and(...conds))
    .returning();
  return lead ?? null;
}

export async function deleteLead(id: string): Promise<void> {
  await db.update(leads).set({ supprimeLe: new Date(), version: sql`${leads.version} + 1` }).where(eq(leads.id, id));
}

// Statut le plus « avancé » entre deux prospects (pour ne pas écraser un gagné lors d'une fusion).
const STATUS_RANK: Record<string, number> = { nouveau: 0, pas_de_reponse: 0, perdu: 1, contacté: 2, devis_envoyé: 3, gagné: 4 };

// Fusionne `duplicateId` dans `masterId` : transfère les enfants (suivis, devis, lien client),
// complète les champs vides, garde le STATUT le plus avancé, concatène les notes, puis supprime
// le doublon EN DERNIER (pour rester ré-exécutable en cas d'échec partiel — pas de transaction neon-http).
export async function mergeLeads(masterId: string, duplicateId: string): Promise<Lead | null> {
  const [master, duplicate] = await Promise.all([
    getLeadById(masterId),
    getLeadById(duplicateId),
  ]);
  if (!master || !duplicate) return null;

  // 1) Transfert des enfants du doublon vers le master (AVANT la suppression du doublon).
  // Ces updates ne sont PAS avalés : si un transfert échoue, on interrompt la fusion (le
  // doublon n'est pas supprimé, rien n'est perdu, la fusion est rejouable). Avant, un échec
  // silencieux ici + suppression du doublon = historique suivis/devis perdu sans trace.
  await db.update(suivis).set({ leadId: masterId }).where(eq(suivis.leadId, duplicateId));
  await db.update(devisEnvois).set({ leadId: masterId }).where(eq(devisEnvois.leadId, duplicateId));
  // Lien client : si le doublon est déjà converti et pas le master, on rattache son client au master.
  let clientIdToKeep = master.clientId ?? null;
  if (!master.clientId && duplicate.clientId) {
    clientIdToKeep = duplicate.clientId;
    await db.update(clients).set({ leadId: masterId }).where(eq(clients.id, duplicate.clientId));
  }

  // 2) Champs fusionnés (master prioritaire, doublon en complément ; statut le plus avancé).
  const keepDuplicateDevis = !master.devisToken && !!duplicate.devisToken; // récupère le devis du doublon si le master n'en a pas
  const merged: Partial<NewLead> = {
    email:    master.email    ?? duplicate.email    ?? undefined,
    location: master.location ?? duplicate.location ?? undefined,
    address:  master.address  ?? duplicate.address  ?? undefined,
    project:  master.project  ?? duplicate.project  ?? undefined,
    message:  master.message  ?? duplicate.message  ?? undefined,
    status:   ((STATUS_RANK[duplicate.status] ?? 0) > (STATUS_RANK[master.status] ?? 0) ? duplicate.status : master.status),
    clientId: clientIdToKeep ?? undefined,
    montantDevisCt: master.montantDevisCt ?? duplicate.montantDevisCt ?? undefined,
    ...(keepDuplicateDevis ? {
      devisToken: duplicate.devisToken, devisUrl: duplicate.devisUrl, devisNomFichier: duplicate.devisNomFichier,
      devisEnvoyeLe: duplicate.devisEnvoyeLe, devisDecision: duplicate.devisDecision, devisDecisionLe: duplicate.devisDecisionLe,
    } : {}),
  };
  const parts = [master.notes, duplicate.notes].filter(Boolean);
  if (parts.length) merged.notes = parts.join("\n---\n");

  // Si la fusion fait avancer le statut du master (statut le plus avancé des deux), on redate le
  // passage : sinon les minuteries de cycle de vie (relances, auto-perdu) s'appuieraient sur une
  // vieille date héritée et se déclencheraient à contretemps.
  const statusBumped = merged.status !== undefined && merged.status !== master.status
    ? { statutChangeLe: new Date(), relanceNotifieeLe: null }
    : {};

  const [updated] = await db
    .update(leads)
    .set({ ...merged, ...statusBumped, version: sql`${leads.version} + 1` as unknown as number, updatedAt: new Date() })
    .where(eq(leads.id, masterId))
    .returning();

  // 3) Suppression (douce) du doublon EN DERNIER.
  await db.update(leads).set({ supprimeLe: new Date(), version: sql`${leads.version} + 1` }).where(eq(leads.id, duplicateId));

  return updated ?? null;
}
