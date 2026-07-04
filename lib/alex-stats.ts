import { db } from "@/lib/db";
import { logsAlex, leads, creneauxAlex } from "@/lib/db/schema";
import { and, eq, gte, sql, desc, asc, isNotNull, inArray } from "drizzle-orm";

export type AlexStats = {
  conversations7j: number;
  conversations30j: number;
  leads7j: number;
  leads30j: number;
  tauxCompletion30j: number | null; // % de conversations qui aboutissent à un lead
  qualifPlus30j: number;            // qualifications approfondies acceptées
  rdvAlex30j: number;               // RDV de visite posés par Alex
};

export type AbandonSession = {
  sessionId: string;
  dernierMessage: Date;
  echanges: { question: string; reponse: string }[];
};

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

/** Indicateurs d'activité d'Alex (7/30 jours) pour la page Assistant Alex. */
export async function getAlexStats(): Promise<AlexStats> {
  const d7 = daysAgo(7), d30 = daysAgo(30);
  const [conv7, conv30, lead7, lead30, qp30, rdv30] = await Promise.all([
    db.select({ n: sql<number>`count(distinct ${logsAlex.sessionId})` }).from(logsAlex)
      .where(and(sql`${logsAlex.action} like 'message%'`, gte(logsAlex.createdAt, d7))),
    db.select({ n: sql<number>`count(distinct ${logsAlex.sessionId})` }).from(logsAlex)
      .where(and(sql`${logsAlex.action} like 'message%'`, gte(logsAlex.createdAt, d30))),
    db.select({ n: sql<number>`count(*)` }).from(logsAlex)
      .where(and(eq(logsAlex.action, "lead_complete"), gte(logsAlex.createdAt, d7))),
    db.select({ n: sql<number>`count(*)` }).from(logsAlex)
      .where(and(eq(logsAlex.action, "lead_complete"), gte(logsAlex.createdAt, d30))),
    db.select({ n: sql<number>`count(*)` }).from(leads)
      .where(and(sql`${leads.qualification}->>'qualifPlus' = 'true'`, gte(leads.updatedAt, d30))),
    db.select({ n: sql<number>`count(*)` }).from(creneauxAlex)
      .where(and(eq(creneauxAlex.statut, "reserve"), isNotNull(creneauxAlex.reserveLe), gte(creneauxAlex.reserveLe, d30))),
  ]);
  const conversations30j = Number(conv30[0]?.n ?? 0);
  const leads30j = Number(lead30[0]?.n ?? 0);
  return {
    conversations7j: Number(conv7[0]?.n ?? 0),
    conversations30j,
    leads7j: Number(lead7[0]?.n ?? 0),
    leads30j,
    tauxCompletion30j: conversations30j > 0 ? Math.round((leads30j / conversations30j) * 100) : null,
    qualifPlus30j: Number(qp30[0]?.n ?? 0),
    rdvAlex30j: Number(rdv30[0]?.n ?? 0),
  };
}

/** Conversations ABANDONNÉES récentes (des échanges mais pas de lead, inactives depuis 1 h) :
 *  c'est en les lisant qu'on voit où les prospects décrochent et qu'on améliore le script. */
export async function getAbandonSessions(limit = 8): Promise<AbandonSession[]> {
  const d14 = daysAgo(14);
  // Sessions récentes avec au moins un échange, SANS lead_complete, inactives depuis 1 h.
  const sessions = await db
    .select({
      sessionId: logsAlex.sessionId,
      dernier: sql<string>`max(${logsAlex.createdAt})`,
    })
    .from(logsAlex)
    .where(gte(logsAlex.createdAt, d14))
    .groupBy(logsAlex.sessionId)
    .having(sql`sum(case when ${logsAlex.action} = 'lead_complete' then 1 else 0 end) = 0
      and max(${logsAlex.createdAt}) < now() - interval '1 hour'
      and count(*) >= 2`)
    .orderBy(desc(sql`max(${logsAlex.createdAt})`))
    .limit(limit);

  if (sessions.length === 0) return [];

  const ids = sessions.map((s) => s.sessionId);
  const rows = await db.select().from(logsAlex)
    .where(and(gte(logsAlex.createdAt, d14), inArray(logsAlex.sessionId, ids)))
    .orderBy(asc(logsAlex.createdAt));

  return sessions.map((s) => ({
    sessionId: s.sessionId,
    dernierMessage: new Date(s.dernier),
    echanges: rows
      .filter((r) => r.sessionId === s.sessionId && (r.action ?? "").startsWith("message"))
      .map((r) => ({ question: r.input ?? "", reponse: (r.output ?? "").replace(/\[\[(PHOTO|RDV)\]\]/gi, "").trim() })),
  }));
}
