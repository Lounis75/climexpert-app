import { db } from "@/lib/db";
import { leads, devis, factures, interventions, clients, savTickets, logsAlex } from "@/lib/db/schema";
import { eq, gte, lte, ne, desc, and, sql, isNull, count } from "drizzle-orm";

export type DashboardStats = {
  // Factures
  caEncaisseCt: number;         // sum totalTtcCt WHERE status = 'payée'
  caAttenteCtTotal: number;     // sum totalTtcCt WHERE status IN ('en_attente','en_retard')
  facturesEnRetard: number;     // count en_retard

  // Devis
  devisTotal: number;
  devisBrouillon: number;
  devisEnvoye: number;
  devisAccepte: number;
  devisRefuse: number;

  // Leads
  leadsTotal: number;
  leadsNouveau: number;
  leadsActifs: number;          // nouveau + contacté + devis_envoyé
  leadsGagnes: number;

  // Interventions
  interventionsAVenir: number;
  prochaines: ProchInterv[];

  // CA mensuel (6 derniers mois)
  caMensuel: { mois: string; ct: number }[];

  // Derniers leads
  derniersLeads: DernierLead[];

  // Nouvelles métriques P8-54
  interventionsCetteSemaine: number;
  interventionsTerminees: number;
  savOuverts: number;
  caTrendPct: number | null; // % growth vs last month
  tauxConversionDevis: number; // devisAccepte / devisTotal
};

export type ProchInterv = {
  id: string;
  clientName: string | null;
  type: string;
  scheduledAt: Date | string | null;
  status: string;
};

export type DernierLead = {
  id: string;
  name: string;
  phone: string;
  status: string;
  source: string | null;
  project: string | null;
  location: string | null;
  createdAt: Date | string;
};

export type AlexLeadRef = {
  id: string;
  name: string;
  status: string;
  createdAt: Date | string;
};

export type AlexStats = {
  conversationsTotal: number;
  conversationsComplete: number;
  tauxConversion: number;
  messagesTotal: number;
  conversionCetteSemaine: number;
  conversionSemainePrecedente: number;
  leadsGeneresPeriode: AlexLeadRef[];
};

export async function getAlexStats(since?: Date): Promise<AlexStats> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);

  const [periodLogs, [weekConv], [prevWeekConv], leadsGeneresPeriode] = await Promise.all([
    // Logs de la période (filtrés SQL si since est défini)
    since
      ? db.select().from(logsAlex).where(gte(logsAlex.createdAt, since))
      : db.select().from(logsAlex),
    // Leads convertis cette semaine
    db.select({ cnt: count() }).from(logsAlex)
      .where(and(eq(logsAlex.action, "lead_complete"), gte(logsAlex.createdAt, weekStart))),
    // Leads convertis semaine précédente
    db.select({ cnt: count() }).from(logsAlex)
      .where(and(
        eq(logsAlex.action, "lead_complete"),
        gte(logsAlex.createdAt, prevWeekStart),
        lte(logsAlex.createdAt, weekStart),
      )),
    // Leads Alex de la période
    db.select({ id: leads.id, name: leads.name, status: leads.status, createdAt: leads.createdAt })
      .from(leads)
      .where(and(eq(leads.source, "alex"), ...(since ? [gte(leads.createdAt, since)] : []))),
  ]);

  const sessions = new Set(periodLogs.map((l) => l.sessionId));
  const completeSessions = new Set(
    periodLogs.filter((l) => l.action === "lead_complete").map((l) => l.sessionId)
  );
  const total = sessions.size;
  const complete = completeSessions.size;

  return {
    conversationsTotal: total,
    conversationsComplete: complete,
    tauxConversion: total > 0 ? Math.round((complete / total) * 100) : 0,
    messagesTotal: periodLogs.filter((l) => l.action === "message").length,
    conversionCetteSemaine: Number(weekConv?.cnt ?? 0),
    conversionSemainePrecedente: Number(prevWeekConv?.cnt ?? 0),
    leadsGeneresPeriode,
  };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    factureAggs,
    devisAggs,
    leadAggs,
    [interventionsFutures],
    [interventionsSemaine],
    [interventionsTerminees],
    [savOuvertsRow],
    prochaines5,
    derniersLeads6,
    facturesPayeesMois,
  ] = await Promise.all([
    // ─ Factures : SUM+COUNT par statut
    db.select({
      status: factures.status,
      totalCt: sql<number>`coalesce(sum(${factures.totalTtcCt}), 0)`,
      cnt: sql<number>`count(*)`,
    }).from(factures).groupBy(factures.status),

    // ─ Devis : COUNT par statut
    db.select({
      status: devis.status,
      cnt: sql<number>`count(*)`,
    }).from(devis).groupBy(devis.status),

    // ─ Leads : COUNT par statut (hors supprimés)
    db.select({
      status: leads.status,
      cnt: sql<number>`count(*)`,
    }).from(leads).where(isNull(leads.supprimeLe)).groupBy(leads.status),

    // ─ Interventions futures
    db.select({ cnt: sql<number>`count(*)` }).from(interventions)
      .where(and(gte(interventions.scheduledAt, now), ne(interventions.status, "annulée"))),

    // ─ Interventions cette semaine
    db.select({ cnt: sql<number>`count(*)` }).from(interventions)
      .where(and(
        gte(interventions.scheduledAt, weekStart),
        lte(interventions.scheduledAt, weekEnd),
        ne(interventions.status, "annulée"),
      )),

    // ─ Interventions terminées
    db.select({ cnt: sql<number>`count(*)` }).from(interventions)
      .where(eq(interventions.status, "terminée")),

    // ─ SAV ouverts
    db.select({ cnt: sql<number>`count(*)` }).from(savTickets)
      .where(sql`${savTickets.status} in ('ouvert', 'en_cours')`),

    // ─ Prochaines 5 interventions avec nom client (JOIN)
    db.select({
      id: interventions.id,
      clientName: clients.name,
      type: interventions.type,
      scheduledAt: interventions.scheduledAt,
      status: interventions.status,
    })
    .from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .where(and(gte(interventions.scheduledAt, now), ne(interventions.status, "annulée")))
    .orderBy(interventions.scheduledAt)
    .limit(5),

    // ─ Derniers 6 leads seulement
    db.select({
      id: leads.id, name: leads.name, phone: leads.phone, status: leads.status,
      source: leads.source, project: leads.project, location: leads.location, createdAt: leads.createdAt,
    })
    .from(leads)
    .where(isNull(leads.supprimeLe))
    .orderBy(desc(leads.createdAt))
    .limit(6),

    // ─ Factures payées 6 derniers mois seulement (pas tout l'historique)
    db.select({ paidAt: factures.paidAt, createdAt: factures.createdAt, totalTtcCt: factures.totalTtcCt })
    .from(factures)
    .where(and(
      eq(factures.status, "payée"),
      sql`coalesce(${factures.paidAt}, ${factures.createdAt}) >= ${sixMonthsAgo}`,
    )),
  ]);

  // ─── Traitement factures ──────────────────────────────────────────────────────
  let caEncaisseCt = 0, caAttenteCtTotal = 0, facturesEnRetard = 0;
  for (const { status, totalCt, cnt } of factureAggs) {
    if (status === "payée")   caEncaisseCt = Number(totalCt);
    if (status === "en_attente" || status === "en_retard") caAttenteCtTotal += Number(totalCt);
    if (status === "en_retard") facturesEnRetard = Number(cnt);
  }

  // ─── Traitement devis ─────────────────────────────────────────────────────────
  let devisTotal = 0, devisBrouillon = 0, devisEnvoye = 0, devisAccepte = 0, devisRefuse = 0;
  for (const { status, cnt } of devisAggs) {
    devisTotal += Number(cnt);
    if (status === "brouillon") devisBrouillon = Number(cnt);
    if (status === "envoyé")    devisEnvoye    = Number(cnt);
    if (status === "accepté")   devisAccepte   = Number(cnt);
    if (status === "refusé")    devisRefuse    = Number(cnt);
  }

  // ─── Traitement leads ─────────────────────────────────────────────────────────
  let leadsTotal = 0, leadsNouveau = 0, leadsActifs = 0, leadsGagnes = 0;
  for (const { status, cnt } of leadAggs) {
    leadsTotal += Number(cnt);
    if (status === "nouveau")    leadsNouveau = Number(cnt);
    if (["nouveau", "contacté", "devis_envoyé"].includes(status)) leadsActifs += Number(cnt);
    if (status === "gagné")      leadsGagnes  = Number(cnt);
  }

  const interventionsAVenir      = Number(interventionsFutures?.cnt ?? 0);
  const interventionsCetteSemaine = Number(interventionsSemaine?.cnt ?? 0);
  const interventionsTermineesN  = Number(interventionsTerminees?.cnt ?? 0);
  const savOuverts               = Number(savOuvertsRow?.cnt ?? 0);

  // ─── CA mensuel (6 mois) — JS léger car peu de lignes ────────────────────────
  const caMensuel: { mois: string; ct: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear(), month = d.getMonth();
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const ct = facturesPayeesMois
      .filter((f) => { const fd = new Date(f.paidAt ?? f.createdAt); return fd.getFullYear() === year && fd.getMonth() === month; })
      .reduce((s, f) => s + (f.totalTtcCt ?? 0), 0);
    caMensuel.push({ mois: label, ct });
  }

  // ─── Tendance CA ─────────────────────────────────────────────────────────────
  const curMonth = now.getMonth(), curYear = now.getFullYear();
  const prevDate = new Date(curYear, curMonth - 1, 1);
  const caCurrent = facturesPayeesMois
    .filter((f) => { const d = new Date(f.paidAt ?? f.createdAt); return d.getFullYear() === curYear && d.getMonth() === curMonth; })
    .reduce((s, f) => s + (f.totalTtcCt ?? 0), 0);
  const caPrev = facturesPayeesMois
    .filter((f) => { const d = new Date(f.paidAt ?? f.createdAt); return d.getFullYear() === prevDate.getFullYear() && d.getMonth() === prevDate.getMonth(); })
    .reduce((s, f) => s + (f.totalTtcCt ?? 0), 0);
  const caTrendPct = caPrev > 0 ? Math.round(((caCurrent - caPrev) / caPrev) * 100) : null;
  const tauxConversionDevis = devisTotal > 0 ? Math.round((devisAccepte / devisTotal) * 100) : 0;

  return {
    caEncaisseCt,
    caAttenteCtTotal,
    facturesEnRetard,
    devisTotal, devisBrouillon, devisEnvoye, devisAccepte, devisRefuse,
    leadsTotal, leadsNouveau, leadsActifs, leadsGagnes,
    interventionsAVenir,
    prochaines: prochaines5.map((i) => ({ ...i, clientName: i.clientName ?? null })),
    caMensuel,
    derniersLeads: derniersLeads6,
    interventionsCetteSemaine,
    interventionsTerminees: interventionsTermineesN,
    savOuverts,
    caTrendPct,
    tauxConversionDevis,
  };
}

export type LeadsPageStats = {
  // Pipeline statuts
  total: number;
  parStatut: Record<string, number>;
  // Sources
  parSource: Record<string, number>;
  // Tendance mensuelle (8 derniers mois)
  parMois: { mois: string; total: number; alex: number; formulaire: number }[];
  // Alex chatbot
  alex: AlexStats;
};

export async function getLeadsPageStats(alexSince?: Date): Promise<LeadsPageStats> {
  const [allLeads] = await Promise.all([
    db.select({
      id: leads.id,
      status: leads.status,
      source: leads.source,
      createdAt: leads.createdAt,
      supprimeLe: leads.supprimeLe,
    }).from(leads),
  ]);

  const now = new Date();
  const active = allLeads.filter((l) => !l.supprimeLe);

  // ─── Statuts ─────────────────────────────────────────────────────────────────
  const parStatut: Record<string, number> = {
    nouveau: 0, contacté: 0, devis_envoyé: 0, gagné: 0, perdu: 0,
  };
  for (const l of active) parStatut[l.status] = (parStatut[l.status] ?? 0) + 1;

  // ─── Sources ─────────────────────────────────────────────────────────────────
  const parSource: Record<string, number> = {};
  for (const l of active) {
    const s = l.source ?? "autre";
    parSource[s] = (parSource[s] ?? 0) + 1;
  }

  // ─── Tendance mensuelle (8 derniers mois) ─────────────────────────────────
  const parMois: { mois: string; total: number; alex: number; formulaire: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = d.toLocaleDateString("fr-FR", { month: "short" });
    const inMonth = active.filter((l) => {
      const c = new Date(l.createdAt);
      return c >= d && c < end;
    });
    parMois.push({
      mois: label,
      total: inMonth.length,
      alex: inMonth.filter((l) => l.source === "alex").length,
      formulaire: inMonth.filter((l) => l.source === "formulaire").length,
    });
  }

  const alex = await getAlexStats(alexSince);

  return {
    total: active.length,
    parStatut,
    parSource,
    parMois,
    alex,
  };
}
