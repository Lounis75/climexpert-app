import { getDashboardStats, getTachesAFaire, getInterventionsDuJour } from "@/lib/dashboard";
import { getDynamicArticles } from "@/lib/dynamicArticles";
import { getTechniciens } from "@/lib/techniciens";
import AdminHeader from "@/components/AdminHeader";
import DashboardLeadRow from "@/components/DashboardLeadRow";
import InlineAssign from "@/components/InlineAssign";
import CalendrierDashboardWrapper from "@/components/CalendrierDashboardWrapper";
import Link from "next/link";
import {
  Users, FileText, ArrowRight, Wrench, Euro, AlertTriangle,
  ClipboardList, CalendarCheck, CheckCircle2, Clock, Plus,
  UserCircle, Home, HeadphonesIcon, MessageSquare, TrendingUp, TrendingDown,
} from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", maintenance: "Maintenance", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Autre",
};
const TYPE_COLORS: Record<string, string> = {
  installation: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  maintenance:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  entretien:    "bg-amber-500/10 text-amber-400 border-amber-500/20",
  depannage:    "bg-red-500/10 text-red-400 border-red-500/20",
  autre:        "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

function euros(ct: number) {
  return (ct / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function formatTime(d: Date | string | null) {
  if (!d) return "--:--";
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
}

const TASK_COLORS: Record<string, string> = {
  amber:  "bg-amber-500/10 text-amber-400",
  sky:    "bg-sky-500/10 text-sky-400",
  violet: "bg-violet-500/10 text-violet-400",
  red:    "bg-red-500/10 text-red-400",
};

export default async function DashboardPage() {
  const [stats, dynamicArticles, taches, interventionsJour, techniciensList] = await Promise.all([
    getDashboardStats(),
    getDynamicArticles(),
    getTachesAFaire(),
    getInterventionsDuJour(),
    getTechniciens(),
  ]);

  // Options d'affectation : commerciaux (role technico_commercial) et techniciens.
  const commerciaux = techniciensList
    .filter((t) => t.role === "technico_commercial")
    .map((t) => ({ id: t.id, name: t.name, prenom: t.prenom }));
  const techOptions = techniciensList.map((t) => ({ id: t.id, name: t.name, prenom: t.prenom }));

  // ─── Bloc « À faire » (action-first) : tâches en attente, factures, SAV ───────
  const tachesList = [
    { n: taches.interventionsSansTechnicien, label: "intervention(s) sans technicien", href: "/admin/interventions", color: "amber",  icon: Wrench },
    { n: taches.interventionsSansDate,       label: "intervention(s) à planifier",      href: "/admin/interventions", color: "amber",  icon: CalendarCheck },
    { n: taches.prospectsSansCommercial,     label: "prospect(s) à affecter",           href: "/admin/leads",         color: "sky",    icon: Users },
    { n: taches.devisARelancer,              label: "devis à relancer (>7j)",           href: "/admin/devis",         color: "violet", icon: FileText },
    { n: stats.facturesEnRetard,             label: "facture(s) en retard",             href: "/admin/factures",      color: "red",    icon: AlertTriangle },
    { n: stats.savOuverts,                   label: "SAV ouvert(s)",                    href: "/admin/sav",           color: "red",    icon: HeadphonesIcon },
  ].filter((t) => t.n > 0);
  const totalTaches = tachesList.reduce((s, t) => s + t.n, 0);

  const maxCa = Math.max(...stats.caMensuel.map((m) => m.ct), 1);
  const aujourdhui = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* ─── En-tête + actions rapides ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Tableau de bord</h1>
            <p className="text-slate-400 text-sm capitalize">{aujourdhui}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/devis/new" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Devis
            </Link>
            <Link href="/admin/interventions" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/60 border border-white/10 text-slate-200 hover:border-white/20 text-sm font-semibold transition-colors">
              <CalendarCheck className="w-4 h-4" /> Planning
            </Link>
          </div>
        </div>

        {/* ─── À FAIRE (héros) ───────────────────────────────────────────────────── */}
        <div className={`rounded-2xl p-4 mb-6 border ${totalTaches > 0 ? "bg-amber-500/[0.06] border-amber-500/20" : "bg-emerald-500/[0.05] border-emerald-500/20"}`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${totalTaches > 0 ? "bg-amber-500/15 border-amber-500/25 text-amber-400" : "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"}`}>
              <ClipboardList className="w-4 h-4" />
            </div>
            <h2 className="text-white font-semibold text-sm">À faire</h2>
            {totalTaches > 0 && <span className="text-amber-400 text-xs font-bold bg-amber-500/15 px-2 py-0.5 rounded-full">{totalTaches}</span>}
          </div>
          {tachesList.length === 0 ? (
            <div className="flex items-center gap-2 text-emerald-300 text-sm py-2 px-1">
              <CheckCircle2 className="w-4 h-4" /> Tout est à jour — rien en attente. 👌
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {tachesList.map((t) => (
                <Link key={t.label} href={t.href}
                  className="flex items-center gap-3 bg-slate-800/40 border border-white/8 rounded-xl px-3 py-2.5 hover:border-white/20 transition-all group">
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${TASK_COLORS[t.color]}`}>
                    <t.icon className="w-4 h-4" />
                  </span>
                  <p className="text-sm text-slate-200 flex-1 leading-tight">
                    <span className="font-bold text-white">{t.n}</span> {t.label}
                  </p>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ─── Aujourd'hui  |  Argent du mois ────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Aujourd'hui */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-sky-400" /> Aujourd&apos;hui
              </h2>
              <Link href="/admin/interventions" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1 transition-colors">
                Planning <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {interventionsJour.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                <CalendarCheck className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucune intervention aujourd&apos;hui.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {interventionsJour.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-colors">
                    <Link href={`/admin/interventions/${i.id}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-white tabular-nums min-w-[64px]">
                        <Clock className="w-3.5 h-3.5 text-sky-400" /> {formatTime(i.scheduledAt)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate group-hover:text-sky-300 transition-colors">{i.clientName ?? "—"}</p>
                        <p className="text-slate-500 text-xs truncate">{TYPE_LABELS[i.type] ?? i.type}</p>
                      </div>
                    </Link>
                    {/* Affecter un technicien directement */}
                    <InlineAssign kind="technicien" targetId={i.id} currentId={i.technicienId} options={techOptions} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Argent du mois */}
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <Euro className="w-4 h-4 text-emerald-400" /> Argent
              </h2>
              <Link href="/admin/factures" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1">
                Factures <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <div className="flex items-baseline justify-between">
                  <span className="text-slate-400 text-xs">CA encaissé</span>
                  {stats.caTrendPct !== null && (
                    <span className={`text-[11px] font-medium flex items-center gap-0.5 ${stats.caTrendPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {stats.caTrendPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stats.caTrendPct > 0 ? "+" : ""}{stats.caTrendPct}%
                    </span>
                  )}
                </div>
                <p className="text-xl font-bold text-white tabular-nums">{euros(stats.caEncaisseCt)}</p>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-xs">En attente</span>
                <span className="text-white text-sm font-semibold tabular-nums">{euros(stats.caAttenteCtTotal)}</span>
              </div>
              {stats.facturesEnRetard > 0 && (
                <Link href="/admin/factures" className="flex items-center justify-between text-red-400 hover:text-red-300 transition-colors">
                  <span className="text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> En retard</span>
                  <span className="text-sm font-semibold">{stats.facturesEnRetard} facture{stats.facturesEnRetard > 1 ? "s" : ""}</span>
                </Link>
              )}
            </div>

            <p className="text-slate-500 text-[11px] mb-2">6 derniers mois</p>
            <div className="flex items-end gap-1 h-16">
              {stats.caMensuel.map(({ mois, ct }) => (
                <div key={mois} className="flex-1 flex flex-col items-center gap-1" title={`${mois} : ${euros(ct)}`}>
                  <div className="w-full flex items-end" style={{ height: "44px" }}>
                    <div className={`w-full rounded-t transition-all ${ct > 0 ? "bg-emerald-500/40 border border-emerald-500/30" : "bg-slate-700/40"}`}
                      style={{ height: `${Math.max(Math.round((ct / maxCa) * 100), ct > 0 ? 10 : 4)}%` }} />
                  </div>
                  <span className="text-[8px] text-slate-500">{mois.slice(0, 3)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* ─── Derniers prospects  |  Pipeline devis ─────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Derniers prospects */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" /> Derniers prospects
              </h2>
              <Link href="/admin/leads" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1 transition-colors">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {stats.derniersLeads.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun prospect pour l&apos;instant</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {stats.derniersLeads.map((lead) => (
                  <DashboardLeadRow key={lead.id} lead={lead} commerciaux={commerciaux} />
                ))}
              </div>
            )}
          </div>

          {/* Pipeline devis */}
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-sky-400" /> Pipeline devis
              </h2>
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
            {stats.devisTotal === 0 ? (
              <p className="text-slate-600 text-xs text-center mt-4">Aucun devis</p>
            ) : (
              <div className="mt-5 pt-4 border-t border-white/8">
                <p className="text-slate-500 text-xs">Taux d&apos;acceptation</p>
                <p className="text-white text-xl font-bold mt-0.5">
                  {Math.round((stats.devisAccepte / stats.devisTotal) * 100)}%
                </p>
              </div>
            )}
          </div>

        </div>

        {/* ─── Calendrier semaine ────────────────────────────────────────────────── */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-sky-400" /> Semaine en cours
            </h2>
            <Link href="/admin/interventions" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1 transition-colors">
              Gérer <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-4">
            <CalendrierDashboardWrapper />
          </div>
        </div>

        {/* ─── Actions rapides ───────────────────────────────────────────────────── */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm">Actions rapides</h2>
          </div>
          <div className="p-3 grid sm:grid-cols-3 gap-1">
            {[
              { href: "/admin/devis/new",     icon: ClipboardList, color: "sky",    title: "Nouveau devis",   sub: "Créer et envoyer" },
              { href: "/admin/leads",         icon: Users,         color: "violet", title: "Prospects",       sub: stats.leadsNouveau > 0 ? `${stats.leadsNouveau} à traiter` : "Voir le CRM" },
              { href: "/admin/marketing/contacts", icon: FileText,  color: "amber", title: "Base de contacts", sub: "Campagnes & export" },
              { href: "/admin/interventions", icon: Wrench,        color: "emerald",title: "Interventions",   sub: `${stats.interventionsAVenir} à venir` },
              { href: "/admin/clients",       icon: UserCircle,    color: "sky",    title: "Clients",         sub: "Carnet d'adresses" },
              { href: "/",                    icon: Home,          color: "slate",  title: "Voir le site",    sub: "climexpert.fr", target: "_blank" as const },
            ].map(({ href, icon: Icon, color, title, sub, target }) => {
              const cls: Record<string, string> = {
                sky:     "bg-sky-500/10 border-sky-500/20 text-sky-400",
                violet:  "bg-violet-500/10 border-violet-500/20 text-violet-400",
                amber:   "bg-amber-500/10 border-amber-500/20 text-amber-400",
                emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                slate:   "bg-slate-500/10 border-slate-500/20 text-slate-400",
              };
              return (
                <Link key={href} href={href} target={target}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group">
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
