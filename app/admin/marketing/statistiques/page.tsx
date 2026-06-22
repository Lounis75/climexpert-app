import AdminHeader from "@/components/AdminHeader";
import { getMarketingStats } from "@/lib/analytics";
import { getLeadsPageStats } from "@/lib/dashboard";
import LeadsAnalytics from "@/components/LeadsAnalytics";
import Link from "next/link";
import {
  BarChart2, TrendingUp, Users, Bot, ClipboardList, FileText,
  MousePointerClick, Globe, ArrowRight, Search, Target,
} from "lucide-react";

export const dynamic = "force-dynamic";

function getSince(period: string): Date | undefined {
  const now = new Date();
  switch (period) {
    case "1d": return new Date(now.getTime() - 86400000);
    case "7d": return new Date(now.getTime() - 7 * 86400000);
    case "1m": { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d; }
    case "1y": { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d; }
    default: return undefined;
  }
}

const SOURCE_LABELS: Record<string, string> = {
  alex: "Alex (chatbot)", formulaire: "Formulaire", téléphone: "Téléphone",
  whatsapp: "WhatsApp", autre: "Autre",
};

function pageLabel(path: string): string {
  if (path === "/" || path === "") return "Accueil";
  return path;
}

export default async function StatistiquesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period = "all" } = await searchParams;
  const [s, leadStats] = await Promise.all([getMarketingStats(30), getLeadsPageStats(getSince(period))]);
  const maxVisites = Math.max(...s.visitesParJour.map((d) => d.n), 1);
  const maxLeadsJour = Math.max(...s.leadsParJour.map((d) => d.n), 1);
  const maxTopPage = Math.max(...s.topPages.map((p) => p.n), 1);
  const maxSource = Math.max(...s.leadsParSource.map((p) => p.n), 1);

  const kpis = [
    { label: "Visites", value: s.visites, sub: `${s.visiteurs} visiteurs uniques`, icon: TrendingUp, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
    { label: "Calculateur", value: s.calculateurUsages, sub: "utilisations", icon: ClipboardList, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { label: "Alex", value: s.alexConversations, sub: `${s.alexTauxConversion}% convertis`, icon: Bot, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    { label: "Leads générés", value: s.leadsTotalPeriode, sub: "sur la période", icon: Users, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  ];

  // Entonnoir : visites → engagement (calculateur + Alex) → leads → clients
  const engagement = s.calculateurUsages + s.alexConversations;
  const funnel = [
    { label: "Visites", n: s.visites, pct: 100, color: "bg-sky-500/50" },
    { label: "Engagés (Alex / calculateur)", n: engagement, pct: s.visites > 0 ? Math.round((engagement / s.visites) * 100) : 0, color: "bg-violet-500/50" },
    { label: "Leads générés", n: s.leadsTotalPeriode, pct: s.visites > 0 ? Math.round((s.leadsTotalPeriode / s.visites) * 100) : 0, color: "bg-amber-500/50" },
  ];

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* En-tête */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <BarChart2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Statistiques</h1>
            <p className="text-slate-400 text-sm">Trafic &amp; acquisition (30 j) · pipeline commercial &amp; prospects</p>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className="bg-slate-800/40 border border-white/8 rounded-2xl p-4">
              <div className={`w-7 h-7 rounded-lg border flex items-center justify-center mb-2 ${k.color}`}>
                <k.icon className="w-3.5 h-3.5" />
              </div>
              <p className="text-xl font-bold text-white tabular-nums">{k.value}</p>
              <p className="text-slate-300 text-xs font-medium">{k.label}</p>
              <p className="text-slate-500 text-xs mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Trafic — 30 jours */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" /> Trafic du site — 30 jours
            </h2>
            {s.visites > 0 && (
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-400">Pic <span className="text-white font-semibold tabular-nums">{maxVisites}</span>/j</span>
                <span className="text-slate-400">Moy. <span className="text-white font-semibold tabular-nums">{Math.round(s.visites / s.visitesParJour.length)}</span>/j</span>
              </div>
            )}
          </div>
          {s.visites === 0 ? (
            <p className="text-slate-500 text-sm text-center py-6">Le suivi des visites vient de démarrer. Les données apparaîtront au fil du trafic.</p>
          ) : (
            <div className="flex gap-2">
              {/* Axe Y (visites/jour) */}
              <div className="flex flex-col justify-between items-end h-[100px] w-6 flex-shrink-0 text-[10px] text-slate-500 tabular-nums">
                <span>{maxVisites}</span>
                <span>{Math.round(maxVisites / 2)}</span>
                <span>0</span>
              </div>
              {/* Barres + lignes de repère */}
              <div className="relative flex-1">
                <div className="absolute inset-0 h-[100px] flex flex-col justify-between pointer-events-none">
                  <div className="border-t border-white/[0.07]" />
                  <div className="border-t border-white/[0.05]" />
                  <div className="border-t border-white/[0.07]" />
                </div>
                <div className="relative flex items-end gap-1 h-[100px]">
                  {s.visitesParJour.map((d) => (
                    <div key={d.jour} className="flex-1 h-full flex items-end group" title={`${d.jour} : ${d.n} visites`}>
                      <div className={`w-full rounded-t transition-all ${d.n > 0 ? "bg-sky-500/40 border border-sky-500/30 group-hover:bg-sky-500/60" : "bg-slate-700/30"}`}
                        style={{ height: `${Math.max(Math.round((d.n / maxVisites) * 100), d.n > 0 ? 6 : 2)}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Entonnoir de conversion */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-5">
            <Target className="w-4 h-4 text-violet-400" /> Entonnoir de conversion (30 j)
          </h2>
          <div className="space-y-3">
            {funnel.map((f) => (
              <div key={f.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-300 text-xs">{f.label}</span>
                  <span className="text-white text-xs font-medium tabular-nums">{f.n} · {f.pct}%</span>
                </div>
                <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div className={`h-full ${f.color} rounded-full`} style={{ width: `${Math.max(f.pct, f.n > 0 ? 3 : 0)}%` }} />
                </div>
              </div>
            ))}
          </div>
          <p className="text-slate-500 text-[11px] mt-4">Conversion business globale : <span className="text-emerald-400 font-medium">{s.tauxLeadClient}%</span> des leads deviennent clients ({s.clientsTotal} clients / {s.leadsTotal} leads au total).</p>
        </div>

        {/* Top pages | Sources de trafic */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-4">
              <MousePointerClick className="w-4 h-4 text-sky-400" /> Pages les plus vues
            </h2>
            {s.topPages.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">Pas encore de données.</p>
            ) : (
              <div className="space-y-2.5">
                {s.topPages.map((p) => (
                  <div key={p.path}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300 text-xs truncate max-w-[75%]">{pageLabel(p.path)}</span>
                      <span className="text-white text-xs font-medium tabular-nums">{p.n}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500/50 rounded-full" style={{ width: `${Math.round((p.n / maxTopPage) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-4">
              <Globe className="w-4 h-4 text-emerald-400" /> Sources de trafic
            </h2>
            {s.sources.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">Pas encore de données.</p>
            ) : (
              <div className="space-y-2">
                {s.sources.map((src) => (
                  <div key={src.source} className="flex items-center justify-between text-sm">
                    <span className="text-slate-300 text-xs truncate max-w-[70%]">{src.source}</span>
                    <span className="text-white text-xs font-medium tabular-nums">{src.n}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Leads par source | par jour */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-amber-400" /> Leads par source (30 j)
            </h2>
            {s.leadsParSource.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">Aucun lead sur la période.</p>
            ) : (
              <div className="space-y-2.5">
                {s.leadsParSource.map((src) => (
                  <div key={src.source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-300 text-xs">{SOURCE_LABELS[src.source] ?? src.source}</span>
                      <span className="text-white text-xs font-medium tabular-nums">{src.n}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500/50 rounded-full" style={{ width: `${Math.round((src.n / maxSource) * 100)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" /> Leads par jour (30 j)
              </h2>
              {s.leadsTotalPeriode > 0 && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-slate-400">Pic <span className="text-white font-semibold tabular-nums">{maxLeadsJour}</span>/j</span>
                  <span className="text-slate-400">Moy. <span className="text-white font-semibold tabular-nums">{Math.round(s.leadsTotalPeriode / s.leadsParJour.length)}</span>/j</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              {/* Axe Y (leads/jour) */}
              <div className="flex flex-col justify-between items-end h-20 w-6 flex-shrink-0 text-[10px] text-slate-500 tabular-nums">
                <span>{maxLeadsJour}</span>
                <span>{Math.round(maxLeadsJour / 2)}</span>
                <span>0</span>
              </div>
              <div className="relative flex-1">
                <div className="absolute inset-0 h-20 flex flex-col justify-between pointer-events-none">
                  <div className="border-t border-white/[0.07]" />
                  <div className="border-t border-white/[0.05]" />
                  <div className="border-t border-white/[0.07]" />
                </div>
                <div className="relative flex items-end gap-1 h-20">
                  {s.leadsParJour.map((d) => (
                    <div key={d.jour} className="flex-1 h-full flex items-end group" title={`${d.jour} : ${d.n} leads`}>
                      <div className={`w-full rounded-t ${d.n > 0 ? "bg-amber-500/40 border border-amber-500/30" : "bg-slate-700/30"}`}
                        style={{ height: `${Math.max(Math.round((d.n / maxLeadsJour) * 100), d.n > 0 ? 8 : 2)}%` }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SEO */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-3">
            <Search className="w-4 h-4 text-sky-400" /> SEO & contenu
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            <div className="bg-slate-900/40 border border-white/8 rounded-xl p-3">
              <p className="text-lg font-bold text-white tabular-nums">{s.pagesDistinctesVues}</p>
              <p className="text-slate-400 text-xs">pages distinctes vues</p>
            </div>
            <Link href="/admin/articles" className="bg-slate-900/40 border border-white/8 rounded-xl p-3 hover:border-white/20 transition-colors">
              <div className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-amber-400" /><p className="text-slate-300 text-xs font-medium">Articles</p></div>
              <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">Gérer le contenu SEO <ArrowRight className="w-3 h-3" /></p>
            </Link>
          </div>
          <p className="text-slate-500 text-[11px]">
            Pour les positions Google, impressions et mots-clés, il faudra connecter <span className="text-slate-300">Google Search Console</span> (intégration à part). Dis-le-moi si tu veux l&apos;ajouter.
          </p>
        </div>

        {/* ─── Analytiques CRM / Prospects (déplacé depuis la page Prospect) ───── */}
        <LeadsAnalytics stats={leadStats} period={period} />

      </main>
    </div>
  );
}
