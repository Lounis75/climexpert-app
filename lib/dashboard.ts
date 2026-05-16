import { db } from "@/lib/db";
import { leads, devis, factures, interventions, clients, savTickets } from "@/lib/db/schema";
import { eq, gte, desc, and } from "drizzle-orm";

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

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();

  const [
    allFactures,
    allDevis,
    allLeads,
    allInterventions,
    allSav,
  ] = await Promise.all([
    db.select().from(factures).orderBy(desc(factures.createdAt)),
    db.select().from(devis).orderBy(desc(devis.createdAt)),
    db.select().from(leads).orderBy(desc(leads.createdAt)),
    db
      .select({
        id: interventions.id,
        clientId: interventions.clientId,
        type: interventions.type,
        scheduledAt: interventions.scheduledAt,
        status: interventions.status,
      })
      .from(interventions)
      .orderBy(interventions.scheduledAt),
    db.select({ id: savTickets.id, status: savTickets.status }).from(savTickets),
  ]);

  // ─── Factures ────────────────────────────────────────────────────────────────
  const caEncaisseCt = allFactures
    .filter((f) => f.status === "payée")
    .reduce((sum, f) => sum + (f.totalTtcCt ?? 0), 0);

  const caAttenteCtTotal = allFactures
    .filter((f) => f.status === "en_attente" || f.status === "en_retard")
    .reduce((sum, f) => sum + (f.totalTtcCt ?? 0), 0);

  const facturesEnRetard = allFactures.filter((f) => f.status === "en_retard").length;

  // ─── Devis ───────────────────────────────────────────────────────────────────
  const devisTotal    = allDevis.length;
  const devisBrouillon = allDevis.filter((d) => d.status === "brouillon").length;
  const devisEnvoye   = allDevis.filter((d) => d.status === "envoyé").length;
  const devisAccepte  = allDevis.filter((d) => d.status === "accepté").length;
  const devisRefuse   = allDevis.filter((d) => d.status === "refusé").length;

  // ─── Leads ───────────────────────────────────────────────────────────────────
  const leadsTotal  = allLeads.length;
  const leadsNouveau = allLeads.filter((l) => l.status === "nouveau").length;
  const leadsActifs  = allLeads.filter((l) =>
    ["nouveau", "contacté", "devis_envoyé"].includes(l.status)
  ).length;
  const leadsGagnes  = allLeads.filter((l) => l.status === "gagné").length;

  // ─── Interventions ───────────────────────────────────────────────────────────
  const future = allInterventions.filter(
    (i) => i.scheduledAt && new Date(i.scheduledAt) >= now && i.status !== "annulée"
  );
  const interventionsAVenir = future.length;

  // Fetch client names for next 5
  const next5 = future.slice(0, 5);
  const clientIds = [...new Set(next5.map((i) => i.clientId).filter(Boolean))];

  let clientMap: Record<string, string> = {};
  if (clientIds.length > 0) {
    const rows = await db
      .select({ id: clients.id, name: clients.name })
      .from(clients);
    clientMap = Object.fromEntries(rows.map((c) => [c.id, c.name]));
  }

  const prochaines: ProchInterv[] = next5.map((i) => ({
    id: i.id,
    clientName: i.clientId ? (clientMap[i.clientId] ?? null) : null,
    type: i.type,
    scheduledAt: i.scheduledAt,
    status: i.status,
  }));

  // ─── CA mensuel (6 derniers mois) ────────────────────────────────────────────
  const caMensuel: { mois: string; ct: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    const ct = allFactures
      .filter((f) => {
        if (f.status !== "payée") return false;
        const fd = new Date(f.paidAt ?? f.createdAt);
        return fd.getFullYear() === year && fd.getMonth() === month;
      })
      .reduce((sum, f) => sum + (f.totalTtcCt ?? 0), 0);
    caMensuel.push({ mois: label, ct });
  }

  // ─── Nouvelles métriques ─────────────────────────────────────────────────────
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const interventionsCetteSemaine = allInterventions.filter((i) => {
    if (!i.scheduledAt || i.status === "annulée") return false;
    const d = new Date(i.scheduledAt);
    return d >= weekStart && d <= weekEnd;
  }).length;

  const interventionsTerminees = allInterventions.filter((i) => i.status === "terminée").length;
  const savOuverts = allSav.filter((s) => s.status === "ouvert" || s.status === "en_cours").length;

  // CA trend: current month vs previous month
  const curMonth = now.getMonth();
  const curYear  = now.getFullYear();
  const prevDate = new Date(curYear, curMonth - 1, 1);
  const prevMonth = prevDate.getMonth();
  const prevYear  = prevDate.getFullYear();
  const caCurrent = allFactures
    .filter((f) => {
      if (f.status !== "payée") return false;
      const d = new Date(f.paidAt ?? f.createdAt);
      return d.getFullYear() === curYear && d.getMonth() === curMonth;
    })
    .reduce((s, f) => s + (f.totalTtcCt ?? 0), 0);
  const caPrev = allFactures
    .filter((f) => {
      if (f.status !== "payée") return false;
      const d = new Date(f.paidAt ?? f.createdAt);
      return d.getFullYear() === prevYear && d.getMonth() === prevMonth;
    })
    .reduce((s, f) => s + (f.totalTtcCt ?? 0), 0);
  const caTrendPct = caPrev > 0 ? Math.round(((caCurrent - caPrev) / caPrev) * 100) : null;
  const tauxConversionDevis = devisTotal > 0 ? Math.round((devisAccepte / devisTotal) * 100) : 0;

  // ─── Derniers leads ──────────────────────────────────────────────────────────
  const derniersLeads: DernierLead[] = allLeads.slice(0, 6).map((l) => ({
    id: l.id,
    name: l.name,
    phone: l.phone,
    status: l.status,
    source: l.source,
    project: l.project,
    location: l.location,
    createdAt: l.createdAt,
  }));

  return {
    caEncaisseCt,
    caAttenteCtTotal,
    facturesEnRetard,
    devisTotal,
    devisBrouillon,
    devisEnvoye,
    devisAccepte,
    devisRefuse,
    leadsTotal,
    leadsNouveau,
    leadsActifs,
    leadsGagnes,
    interventionsAVenir,
    prochaines,
    caMensuel,
    derniersLeads,
    interventionsCetteSemaine,
    interventionsTerminees,
    savOuverts,
    caTrendPct,
    tauxConversionDevis,
  };
}
