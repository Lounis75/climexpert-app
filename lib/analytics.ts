import { db } from "@/lib/db";
import { evenements, leads, clients, logsAlex } from "@/lib/db/schema";
import { eq, gte, and, sql, count, isNull, desc } from "drizzle-orm";

// ─── Audience (mini-bloc dashboard) ──────────────────────────────────────────

export type Audience = {
  visites: number;
  visiteurs: number;        // sessions distinctes
  calculateur: number;
  alexConversations: number;
  alexLeads: number;
};

export async function getAudience(days = 7): Promise<Audience> {
  const since = new Date(Date.now() - days * 86400000);
  const [pv, sess, calc, alexSess, alexLeadsRow] = await Promise.all([
    db.select({ n: count() }).from(evenements).where(and(eq(evenements.type, "page_view"), gte(evenements.createdAt, since))),
    db.select({ n: sql<number>`count(distinct ${evenements.sessionId})` }).from(evenements).where(and(eq(evenements.type, "page_view"), gte(evenements.createdAt, since))),
    db.select({ n: count() }).from(evenements).where(and(eq(evenements.type, "calculateur_complete"), gte(evenements.createdAt, since))),
    db.select({ n: sql<number>`count(distinct ${logsAlex.sessionId})` }).from(logsAlex).where(gte(logsAlex.createdAt, since)),
    db.select({ n: count() }).from(logsAlex).where(and(eq(logsAlex.action, "lead_complete"), gte(logsAlex.createdAt, since))),
  ]);
  return {
    visites: Number(pv[0]?.n ?? 0),
    visiteurs: Number(sess[0]?.n ?? 0),
    calculateur: Number(calc[0]?.n ?? 0),
    alexConversations: Number(alexSess[0]?.n ?? 0),
    alexLeads: Number(alexLeadsRow[0]?.n ?? 0),
  };
}

// ─── Statistiques marketing complètes ────────────────────────────────────────

export type MarketingStats = {
  periodeJours: number;
  // Trafic
  visites: number;
  visiteurs: number;
  visitesParJour: { jour: string; n: number }[];
  topPages: { path: string; n: number }[];
  sources: { source: string; n: number }[];
  // Outils
  calculateurUsages: number;
  // Alex
  alexConversations: number;
  alexLeads: number;
  alexTauxConversion: number;
  // Génération de leads
  leadsTotalPeriode: number;
  leadsParSource: { source: string; n: number }[];
  leadsParJour: { jour: string; n: number }[];
  // Conversion business (tout l'historique)
  leadsTotal: number;
  clientsTotal: number;
  tauxLeadClient: number;
  // SEO on-site
  pagesDistinctesVues: number;
};

function jourKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function getMarketingStats(days = 30): Promise<MarketingStats> {
  const since = new Date(Date.now() - days * 86400000);

  const [
    visitesRow, visiteursRow, visitesParJourRows, topPagesRows, sourcesRows,
    calcRow, alexSessRow, alexLeadsRow,
    leadsPeriodeRows, leadsParJourRows, leadsTotalRow, clientsTotalRow, pagesDistinctesRow,
  ] = await Promise.all([
    db.select({ n: count() }).from(evenements).where(and(eq(evenements.type, "page_view"), gte(evenements.createdAt, since))),
    db.select({ n: sql<number>`count(distinct ${evenements.sessionId})` }).from(evenements).where(and(eq(evenements.type, "page_view"), gte(evenements.createdAt, since))),
    db.select({ jour: sql<string>`to_char(${evenements.createdAt}, 'YYYY-MM-DD')`, n: count() })
      .from(evenements).where(and(eq(evenements.type, "page_view"), gte(evenements.createdAt, since)))
      .groupBy(sql`to_char(${evenements.createdAt}, 'YYYY-MM-DD')`),
    db.select({ path: evenements.path, n: count() })
      .from(evenements).where(and(eq(evenements.type, "page_view"), gte(evenements.createdAt, since)))
      .groupBy(evenements.path).orderBy(desc(count())).limit(8),
    db.select({ source: evenements.referer, n: count() })
      .from(evenements).where(and(eq(evenements.type, "page_view"), gte(evenements.createdAt, since)))
      .groupBy(evenements.referer).orderBy(desc(count())).limit(6),
    db.select({ n: count() }).from(evenements).where(and(eq(evenements.type, "calculateur_complete"), gte(evenements.createdAt, since))),
    db.select({ n: sql<number>`count(distinct ${logsAlex.sessionId})` }).from(logsAlex).where(gte(logsAlex.createdAt, since)),
    db.select({ n: count() }).from(logsAlex).where(and(eq(logsAlex.action, "lead_complete"), gte(logsAlex.createdAt, since))),
    db.select({ source: leads.source, n: count() })
      .from(leads).where(and(isNull(leads.supprimeLe), gte(leads.createdAt, since)))
      .groupBy(leads.source),
    db.select({ jour: sql<string>`to_char(${leads.createdAt}, 'YYYY-MM-DD')`, n: count() })
      .from(leads).where(and(isNull(leads.supprimeLe), gte(leads.createdAt, since)))
      .groupBy(sql`to_char(${leads.createdAt}, 'YYYY-MM-DD')`),
    db.select({ n: count() }).from(leads).where(isNull(leads.supprimeLe)),
    db.select({ n: count() }).from(clients).where(isNull(clients.supprimeLe)),
    db.select({ n: sql<number>`count(distinct ${evenements.path})` }).from(evenements).where(and(eq(evenements.type, "page_view"), gte(evenements.createdAt, since))),
  ]);

  // Remplit les jours manquants pour les séries (visites + leads).
  const visitesMap = new Map(visitesParJourRows.map((r) => [r.jour, Number(r.n)]));
  const leadsMap = new Map(leadsParJourRows.map((r) => [r.jour, Number(r.n)]));
  const visitesParJour: { jour: string; n: number }[] = [];
  const leadsParJour: { jour: string; n: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const k = jourKey(d);
    visitesParJour.push({ jour: k, n: visitesMap.get(k) ?? 0 });
    leadsParJour.push({ jour: k, n: leadsMap.get(k) ?? 0 });
  }

  const alexConversations = Number(alexSessRow[0]?.n ?? 0);
  const alexLeads = Number(alexLeadsRow[0]?.n ?? 0);
  const leadsTotalPeriode = leadsPeriodeRows.reduce((s, r) => s + Number(r.n), 0);
  const leadsTotal = Number(leadsTotalRow[0]?.n ?? 0);
  const clientsTotal = Number(clientsTotalRow[0]?.n ?? 0);

  return {
    periodeJours: days,
    visites: Number(visitesRow[0]?.n ?? 0),
    visiteurs: Number(visiteursRow[0]?.n ?? 0),
    visitesParJour,
    topPages: topPagesRows.map((r) => ({ path: r.path ?? "-", n: Number(r.n) })),
    sources: sourcesRows.map((r) => ({ source: r.source ?? "Direct / inconnu", n: Number(r.n) })),
    calculateurUsages: Number(calcRow[0]?.n ?? 0),
    alexConversations,
    alexLeads,
    alexTauxConversion: alexConversations > 0 ? Math.round((alexLeads / alexConversations) * 100) : 0,
    leadsTotalPeriode,
    leadsParSource: leadsPeriodeRows.map((r) => ({ source: r.source ?? "autre", n: Number(r.n) })).sort((a, b) => b.n - a.n),
    leadsParJour,
    leadsTotal,
    clientsTotal,
    tauxLeadClient: leadsTotal > 0 ? Math.round((clientsTotal / leadsTotal) * 100) : 0,
    pagesDistinctesVues: Number(pagesDistinctesRow[0]?.n ?? 0),
  };
}
