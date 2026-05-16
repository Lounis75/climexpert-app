import { getDashboardStats } from "@/lib/dashboard";
import { getDynamicArticles } from "@/lib/dynamicArticles";
import { getFeaturedSlugs } from "@/lib/kv";
import AdminHeader from "@/components/AdminHeader";
import Link from "next/link";
import dynamicImport from "next/dynamic";

const CalendrierDashboard = dynamicImport(
  () => import("@/app/admin/interventions/CalendrierDashboard"),
  { ssr: false, loading: () => <div className="h-48 flex items-center justify-center"><div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div> },
);
import DashboardLeadRow from "@/components/DashboardLeadRow";
import {
  Users, FileText, TrendingUp,
  MessageSquare, ArrowRight,
  Wrench, Euro, AlertTriangle,
  ClipboardList, CalendarCheck, CheckCircle2,
  Plus, Star, UserCircle, Home, HeadphonesIcon, TrendingDown,
} from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_COLORS: Record<string, string> = {
  nouveau:      "bg-sky-500/10 text-sky-400 border-sky-500/30",
  contacté:     "bg-amber-500/10 text-amber-400 border-amber-500/30",
  devis_envoyé: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  gagné:        "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  perdu:        "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau", contacté: "Contacté", devis_envoyé: "Devis envoyé",
  gagné: "Gagné", perdu: "Perdu",
};

const PROJECT_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Autre",
};

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", maintenance: "Maintenance",
  depannage: "Dépannage", autre: "Autre",
};

const TYPE_COLORS: Record<string, string> = {
  installation: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  maintenance:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  depannage:    "bg-red-500/10 text-red-400 border-red-500/20",
  autre:        "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

function euros(ct: number) {
  return (ct / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}

function timeAgo(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (h < 1) return "à l'instant";
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${days}j`;
}

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

export default async function DashboardPage() {
  const [stats, dynamicArticles, featuredSlugs] = await Promise.all([
    getDashboardStats(),
    getDynamicArticles(),
    getFeaturedSlugs(),
  ]);

  const maxCa = Math.max(...stats.caMensuel.map((m) => m.ct), 1);
  const tauxConversion = stats.leadsTotal > 0
    ? Math.round((stats.leadsGagnes / stats.leadsTotal) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Tableau de bord</h1>
          <p className="text-slate-400 text-sm">
            {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* ─── KPIs ──────────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <Link href="/admin/factures" className="bg-slate-800/40 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Euro className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5 tabular-nums">{euros(stats.caEncaisseCt)}</p>
            <p className="text-slate-300 text-xs font-medium">CA encaissé</p>
            <p className="text-slate-500 text-xs mt-1">{euros(stats.caAttenteCtTotal)} en attente</p>
          </Link>

          <Link href="/admin/devis" className="bg-slate-800/40 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-3">
              <ClipboardList className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{stats.devisEnvoye + stats.devisBrouillon}</p>
            <p className="text-slate-300 text-xs font-medium">Devis en cours</p>
            <p className="text-slate-500 text-xs mt-1">{stats.devisAccepte} accepté{stats.devisAccepte > 1 ? "s" : ""} · {stats.devisTotal} total</p>
          </Link>

          <Link href="/admin/leads" className="bg-slate-800/40 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{stats.leadsActifs}</p>
            <p className="text-slate-300 text-xs font-medium">Leads actifs</p>
            <p className="text-slate-500 text-xs mt-1">{stats.leadsNouveau} nouveau{stats.leadsNouveau > 1 ? "x" : ""} · {tauxConversion}% conversion</p>
          </Link>

          <Link href="/admin/interventions" className="bg-slate-800/40 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all group">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{stats.interventionsAVenir}</p>
            <p className="text-slate-300 text-xs font-medium">Interventions à venir</p>
            {stats.facturesEnRetard > 0 && (
              <p className="text-red-400 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {stats.facturesEnRetard} facture{stats.facturesEnRetard > 1 ? "s" : ""} en retard
              </p>
            )}
          </Link>

        </div>

        {/* ─── KPIs secondaires ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mb-3">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{stats.interventionsCetteSemaine}</p>
            <p className="text-slate-300 text-xs font-medium">Interventions cette semaine</p>
            <p className="text-slate-500 text-xs mt-1">{stats.interventionsTerminees} terminées au total</p>
          </div>

          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{stats.tauxConversionDevis}%</p>
            <p className="text-slate-300 text-xs font-medium">Taux conv. devis</p>
            <p className="text-slate-500 text-xs mt-1">{stats.devisAccepte} accepté{stats.devisAccepte > 1 ? "s" : ""} / {stats.devisTotal}</p>
          </div>

          <Link href="/admin/sav" className="bg-slate-800/40 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-3">
              <HeadphonesIcon className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-white mb-0.5">{stats.savOuverts}</p>
            <p className="text-slate-300 text-xs font-medium">SAV ouverts</p>
            <p className="text-slate-500 text-xs mt-1">tickets en cours</p>
          </Link>

          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${
              stats.caTrendPct === null ? "bg-slate-500/10 border-slate-500/20 text-slate-400" :
              stats.caTrendPct >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
              "bg-red-500/10 border-red-500/20 text-red-400"
            }`}>
              {stats.caTrendPct === null || stats.caTrendPct >= 0
                ? <TrendingUp className="w-4 h-4" />
                : <TrendingDown className="w-4 h-4" />
              }
            </div>
            <p className={`text-2xl font-bold mb-0.5 ${
              stats.caTrendPct === null ? "text-slate-400" :
              stats.caTrendPct >= 0 ? "text-emerald-400" : "text-red-400"
            }`}>
              {stats.caTrendPct === null ? "—" : `${stats.caTrendPct > 0 ? "+" : ""}${stats.caTrendPct}%`}
            </p>
            <p className="text-slate-300 text-xs font-medium">Tendance CA</p>
            <p className="text-slate-500 text-xs mt-1">vs mois précédent</p>
          </div>

        </div>

        {/* ─── CA mensuel + Pipeline devis ───────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* CA mensuel */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-sm">CA encaissé — 6 derniers mois</h2>
              <Link href="/admin/factures" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1">
                Factures <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="flex items-end gap-2 h-32">
              {stats.caMensuel.map(({ mois, ct }) => {
                const pct = Math.round((ct / maxCa) * 100);
                return (
                  <div key={mois} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-[9px] text-slate-500 tabular-nums">{ct > 0 ? euros(ct) : ""}</span>
                    <div className="w-full flex items-end" style={{ height: "72px" }}>
                      <div
                        className={`w-full rounded-t-lg transition-all ${ct > 0 ? "bg-emerald-500/40 border border-emerald-500/30" : "bg-slate-700/40 border border-white/5"}`}
                        style={{ height: `${Math.max(pct, ct > 0 ? 8 : 4)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-500 text-center leading-tight">{mois}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pipeline devis */}
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-sm">Pipeline devis</h2>
              <Link href="/admin/devis" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1">
                Voir <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { label: "Brouillons", count: stats.devisBrouillon, color: "bg-slate-400" },
                { label: "Envoyés", count: stats.devisEnvoye, color: "bg-violet-400" },
                { label: "Acceptés", count: stats.devisAccepte, color: "bg-emerald-400" },
                { label: "Refusés", count: stats.devisRefuse, color: "bg-red-400" },
              ].map(({ label, count, color }) => {
                const pct = stats.devisTotal > 0 ? Math.round((count / stats.devisTotal) * 100) : 0;
                return (
                  <div key={label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-slate-400 text-xs">{label}</span>
                      <span className="text-white text-xs font-medium tabular-nums">{count}</span>
                    </div>
                    <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                      <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {stats.devisTotal === 0 && (
              <p className="text-slate-600 text-xs text-center mt-4">Aucun devis</p>
            )}

            {stats.devisTotal > 0 && (
              <div className="mt-5 pt-4 border-t border-white/8">
                <p className="text-slate-500 text-xs">Taux d&apos;acceptation</p>
                <p className="text-white text-xl font-bold mt-0.5">
                  {stats.devisTotal > 0 ? Math.round((stats.devisAccepte / stats.devisTotal) * 100) : 0}%
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ─── Leads récents + Interventions à venir ─────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Derniers leads */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm">Derniers leads</h2>
              <Link href="/admin/leads" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1 transition-colors">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {stats.derniersLeads.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun lead pour l&apos;instant</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {stats.derniersLeads.map((lead) => (
                  <DashboardLeadRow key={lead.id} lead={lead} />
                ))}
              </div>
            )}
          </div>

          {/* Interventions à venir */}
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm">Prochaines interventions</h2>
              <Link href="/admin/interventions" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1">
                Voir <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {stats.prochaines.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                <CalendarCheck className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-xs">Aucune intervention planifiée</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {stats.prochaines.map((i) => (
                  <Link
                    key={i.id}
                    href={`/admin/interventions/${i.id}`}
                    className="flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors"
                  >
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5 flex-shrink-0 ${TYPE_COLORS[i.type] ?? TYPE_COLORS.autre}`}>
                      {TYPE_LABELS[i.type] ?? i.type}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{i.clientName ?? "—"}</p>
                      <p className="text-slate-500 text-[10px] mt-0.5">{formatDate(i.scheduledAt)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* ─── Calendrier semaine ────────────────────────────────────────────────── */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-sky-400" /> Calendrier — semaine en cours
            </h2>
            <Link href="/admin/interventions" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1 transition-colors">
              Gérer <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            <CalendrierDashboard />
          </div>
        </div>

        {/* ─── Actions rapides ───────────────────────────────────────────────────── */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm">Actions rapides</h2>
          </div>
          <div className="p-3 grid sm:grid-cols-3 gap-1">
            {[
              { href: "/admin/devis/new",    icon: ClipboardList, color: "sky",    title: "Nouveau devis",     sub: "Créer et envoyer" },
              { href: "/admin/leads",        icon: Users,         color: "violet", title: "Gérer les leads",   sub: stats.leadsNouveau > 0 ? `${stats.leadsNouveau} à traiter` : "Voir le CRM" },
              { href: "/admin/articles/new", icon: FileText,      color: "amber",  title: "Nouvel article",    sub: `${dynamicArticles.length + 1}e article` },
              { href: "/admin/interventions",icon: Wrench,        color: "emerald",title: "Interventions",     sub: `${stats.interventionsAVenir} à venir` },
              { href: "/admin/clients",      icon: UserCircle,    color: "sky",    title: "Clients",           sub: "Carnet d'adresses" },
              { href: "/",                   icon: Home,          color: "slate",  title: "Voir le site",      sub: "climexpert.fr", target: "_blank" as const },
            ].map(({ href, icon: Icon, color, title, sub, target }) => {
              const cls: Record<string, string> = {
                sky:     "bg-sky-500/10 border-sky-500/20 text-sky-400",
                violet:  "bg-violet-500/10 border-violet-500/20 text-violet-400",
                amber:   "bg-amber-500/10 border-amber-500/20 text-amber-400",
                emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                slate:   "bg-slate-500/10 border-slate-500/20 text-slate-400",
              };
              return (
                <Link
                  key={href}
                  href={href}
                  target={target}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${cls[color]}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">{title}</p>
                    <p className="text-slate-500 text-xs">{sub}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
