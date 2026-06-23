import { getDashboardStats, getTachesAFaire, getProchainesInterventions, getInterventionsAPlanifier, getInterventionsParClient, getCaSigne, getApercuCommercial } from "@/lib/dashboard";
import { getRelancesDuJour } from "@/lib/actions";
import { getAudience } from "@/lib/analytics";
import { getDynamicArticles, isPublished } from "@/lib/dynamicArticles";
import { getCommerciauxAssignables, getTechniciensAssignables } from "@/lib/utilisateurs";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import AdminHeader from "@/components/AdminHeader";
import DashboardLeadRow from "@/components/DashboardLeadRow";
import InlineAssign from "@/components/InlineAssign";
import PlanifierInline from "@/components/PlanifierInline";
import CalendrierDashboardWrapper from "@/components/CalendrierDashboardWrapper";
import Link from "next/link";
import {
  Users, FileText, ArrowRight, Wrench, Euro, AlertTriangle,
  ClipboardList, CalendarCheck, CalendarPlus, CheckCircle2, Clock, Plus,
  UserCircle, Home, HeadphonesIcon, MessageSquare, TrendingUp, ScrollText, Phone,
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
const STATUT_BADGE: Record<string, { label: string; cls: string }> = {
  planifiée: { label: "Planifiée", cls: "bg-sky-500/15 text-sky-300 border-sky-500/25" },
  en_cours:  { label: "En cours",  cls: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
  terminée:  { label: "Terminée",  cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25" },
};

function euros(ct: number) {
  return (ct / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
}
function formatTime(d: Date | string | null) {
  if (!d) return "--:--";
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
}

function formatDayShort(d: Date | string | null) {
  if (!d) return "-";
  const date = new Date(d);
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return "Auj.";
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });
}

const TASK_COLORS: Record<string, string> = {
  amber:   "bg-amber-500/10 text-amber-400",
  sky:     "bg-sky-500/10 text-sky-400",
  violet:  "bg-violet-500/10 text-violet-400",
  red:     "bg-red-500/10 text-red-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
};

export default async function DashboardPage() {
  const [stats, dynamicArticles, taches, interventionsJour, interventionsAPlanifier, commerciaux, techOptions, audience, caSigne, apercu, relances] = await Promise.all([
    getDashboardStats(),
    getDynamicArticles(),
    getTachesAFaire(),
    getProchainesInterventions(12),
    getInterventionsAPlanifier(),
    getCommerciauxAssignables(),  // commerciaux + admins
    getTechniciensAssignables(),  // techniciens + admins
    getAudience(7),
    getCaSigne(),                 // CA signé semaine/mois/année (montant TTC des "gagné")
    getApercuCommercial(),        // devis envoyés / validés / contrats actifs
    getRelancesDuJour(),          // prospects à traiter aujourd'hui (nominatif)
  ]);

  // Interventions par client (pour le bouton Créer/Voir sur les prospects gagnés).
  const clientIds = stats.derniersLeads.map((l) => l.clientId).filter((x): x is string => !!x);
  const intervsByClient = await getInterventionsParClient(clientIds);

  const articlesPublies = dynamicArticles.filter((a) => isPublished(a)).length;
  const audienceKpis = [
    { label: "Visites", value: audience.visites, sub: `${audience.visiteurs} visiteurs`, color: "text-sky-400 bg-sky-500/10 border-sky-500/20", icon: TrendingUp },
    { label: "Calculateur", value: audience.calculateur, sub: "utilisations", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: ClipboardList },
    { label: "Alex", value: audience.alexConversations, sub: `${audience.alexLeads} leads`, color: "text-violet-400 bg-violet-500/10 border-violet-500/20", icon: MessageSquare },
    { label: "Articles SEO", value: articlesPublies, sub: "publiés", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: FileText },
  ];

  // ─── Bloc « À faire » (action-first) : tâches en attente, factures, SAV ───────
  const tachesList = [
    { n: taches.interventionsSansTechnicien, label: "intervention(s) sans technicien", href: "/admin/interventions", color: "amber",  icon: Wrench },
    { n: taches.interventionsSansDate,       label: "intervention(s) à planifier",      href: "/admin/interventions", color: "amber",  icon: CalendarCheck },
    { n: taches.prospectsSansCommercial,     label: "prospect(s) à affecter",           href: "/admin/leads",         color: "sky",    icon: Users },
    { n: taches.devisAChiffrer,              label: "devis à chiffrer (montant manquant)", href: "/admin/leads",      color: "red",     icon: FileText },
    { n: taches.entretiensARelancer,         label: "entretien(s) à relancer",          href: "/admin/clients",       color: "emerald", icon: Wrench },
    { n: stats.savOuverts,                   label: "SAV ouvert(s)",                    href: "/admin/sav",           color: "red",    icon: HeadphonesIcon },
  ].filter((t) => t.n > 0);
  const totalTaches = tachesList.reduce((s, t) => s + t.n, 0);
  // Optimisation espaces : si des relances ou des interventions à planifier existent, on met
  // « À faire » et ces listes côte à côte (2 colonnes) au lieu de pleine largeur empilée.
  const hasRightCol = relances.length > 0 || interventionsAPlanifier.length > 0;

  const aujourdhui = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  // Prénom de l'admin connecté pour personnaliser l'accueil.
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;
  const prenom = session?.nom?.trim().split(/\s+/)[0] ?? "";

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* ─── En-tête + actions rapides ─────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Tableau de bord{prenom ? ` de ${prenom}` : ""}</h1>
            <p className="text-slate-400 text-sm capitalize">{aujourdhui}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link href="/admin/leads" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Prospect
            </Link>
            <Link href="/admin/interventions/new" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors">
              <Plus className="w-4 h-4" /> Intervention
            </Link>
            <Link href="/admin/interventions" className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800/60 border border-white/10 text-slate-200 hover:border-white/20 text-sm font-semibold transition-colors">
              <CalendarCheck className="w-4 h-4" /> Planning
            </Link>
          </div>
        </div>

        {/* ─── Zone d'action : « À faire » | relances + à planifier (2 colonnes) ──── */}
        <div className={hasRightCol ? "grid lg:grid-cols-2 gap-6 mb-6 items-start" : "mb-6"}>

        {/* À FAIRE (héros) */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-white/8">
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center ${totalTaches > 0 ? "bg-amber-500/15 border-amber-500/25 text-amber-400" : "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"}`}>
              <ClipboardList className="w-4 h-4" />
            </div>
            <h2 className="text-white font-semibold text-sm">À faire</h2>
            {totalTaches > 0 && <span className="text-amber-400 text-xs font-bold bg-amber-500/15 px-2 py-0.5 rounded-full">{totalTaches}</span>}
          </div>
          <div className="p-4">
            {tachesList.length === 0 ? (
              <div className="flex items-center gap-2 text-emerald-300 text-sm py-2 px-1">
                <CheckCircle2 className="w-4 h-4" /> Tout est à jour, rien en attente. 👌
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-2">
                {tachesList.map((t) => (
                  <Link key={t.label} href={t.href}
                    className="flex items-center gap-3 bg-slate-900/40 border border-white/8 rounded-xl px-3 py-2.5 hover:border-white/20 transition-all group">
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
        </div>

        {hasRightCol && (
        <div className="space-y-6">
        {/* ─── Mes relances du jour (prospects à traiter, nominatif) ──────────────── */}
        {relances.length > 0 && (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400" /> Mes relances du jour
                <span className="text-amber-400 text-xs font-bold bg-amber-500/15 px-2 py-0.5 rounded-full">{relances.length}</span>
              </h2>
              <Link href="/admin/leads" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1 transition-colors">
                Voir le CRM <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
              {relances.map((r) => (
                <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-colors">
                  <Link href={`/admin/leads?lead=${r.id}`} className="flex-1 min-w-0 group">
                    <p className="text-white text-sm font-medium truncate group-hover:text-sky-300 transition-colors">{r.name}</p>
                    <p className="text-red-300 text-xs flex items-center gap-1 mt-0.5"><AlertTriangle className="w-3 h-3 flex-shrink-0" /> {r.action}</p>
                  </Link>
                  <a href={`tel:${r.phone}`} className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-400 hover:bg-sky-500/20 flex items-center justify-center flex-shrink-0 transition-colors" title={`Appeler ${r.phone}`}>
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── À planifier (interventions sans date, ex. devis gagné) ────────────── */}
        {interventionsAPlanifier.length > 0 && (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2 flex-wrap">
              <CalendarPlus className="w-4 h-4 text-sky-400" />
              <h2 className="text-white font-semibold text-sm">À planifier</h2>
              <span className="text-sky-400 text-xs font-bold bg-sky-500/15 px-2 py-0.5 rounded-full">{interventionsAPlanifier.length}</span>
              <span className="text-slate-500 text-xs">interventions sans date (devis gagnés)</span>
            </div>
            <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
              {interventionsAPlanifier.map((i) => (
                <div key={i.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3">
                  <Link href={`/admin/interventions/${i.id}`} className="flex-1 min-w-0 group">
                    <p className="text-white text-sm font-medium truncate group-hover:text-sky-300 transition-colors">{i.clientName ?? "-"}</p>
                    <p className="text-slate-500 text-xs">{TYPE_LABELS[i.type] ?? i.type}</p>
                  </Link>
                  <PlanifierInline interventionId={i.id} currentTechnicienId={i.technicienId} techniciens={techOptions} />
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
        )}
        </div>

        {/* ─── Aujourd'hui  |  Argent du mois ────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-6 mb-6">

          {/* Aujourd'hui */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <CalendarCheck className="w-4 h-4 text-sky-400" /> Prochaines interventions
              </h2>
              <Link href="/admin/interventions" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1 transition-colors">
                Planning <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {interventionsJour.length === 0 ? (
              <div className="py-10 text-center text-slate-500">
                <CalendarCheck className="w-7 h-7 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucune intervention à venir.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5 max-h-[420px] overflow-y-auto">
                {interventionsJour.map((i) => (
                  <div key={i.id} className="flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-colors">
                    <Link href={`/admin/interventions/${i.id}`} className="flex items-center gap-3 flex-1 min-w-0 group">
                      <div className="min-w-[78px] flex-shrink-0">
                        <p className="text-[11px] text-slate-400 capitalize leading-tight">{formatDayShort(i.scheduledAt)}</p>
                        <p className="flex items-center gap-1 text-sm font-bold text-white tabular-nums leading-tight">
                          <Clock className="w-3.5 h-3.5 text-sky-400" /> {formatTime(i.scheduledAt)}
                        </p>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate group-hover:text-sky-300 transition-colors">{i.clientName ?? "-"}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-slate-500 text-xs truncate">{TYPE_LABELS[i.type] ?? i.type}</span>
                          {STATUT_BADGE[i.status] && <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 ${STATUT_BADGE[i.status].cls}`}>{STATUT_BADGE[i.status].label}</span>}
                        </div>
                      </div>
                    </Link>
                    {/* Affecter un technicien directement */}
                    <InlineAssign kind="technicien" targetId={i.id} currentId={i.technicienId} options={techOptions} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Argent, CA signé (montant TTC des prospects "gagné") */}
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <Euro className="w-4 h-4 text-emerald-400" /> Argent
                <span className="text-slate-500 font-normal text-xs">· CA signé</span>
              </h2>
              <Link href="/admin/leads" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1">
                Prospects <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                { label: "Semaine", ct: caSigne.semaineCt, n: caSigne.nbSemaine },
                { label: "Mois",    ct: caSigne.moisCt,    n: caSigne.nbMois },
                { label: "Année",   ct: caSigne.anneeCt,   n: caSigne.nbAnnee },
              ].map((p) => (
                <div key={p.label} className="bg-slate-900/40 border border-white/8 rounded-xl px-2.5 py-3 text-center">
                  <p className="text-[11px] text-slate-500 mb-1">{p.label}</p>
                  <p className="text-base font-bold text-emerald-300 tabular-nums leading-tight">{euros(p.ct)}</p>
                  <p className="text-[10px] text-slate-600 mt-0.5">{p.n} signé{p.n > 1 ? "s" : ""}</p>
                </div>
              ))}
            </div>

            <p className="text-slate-500 text-[11px]">Basé sur le montant TTC des prospects passés en « Gagné ».</p>
          </div>

        </div>

        {/* ─── Derniers prospects  |  Suivi devis & contrats ─────────────────────── */}
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
                  <DashboardLeadRow key={lead.id} lead={lead} commerciaux={commerciaux}
                    interventionInfo={lead.clientId ? intervsByClient[lead.clientId] : undefined} />
                ))}
              </div>
            )}
          </div>

          {/* Suivi devis & contrats de maintenance */}
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-sky-400" /> Suivi devis
              </h2>
              <Link href="/admin/leads" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1">
                Voir <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2 mb-5">
              {/* Devis envoyés (en attente de signature) */}
              <Link href="/admin/leads" className="flex items-center justify-between rounded-xl bg-slate-900/40 border border-white/8 px-3 py-2.5 hover:border-violet-500/30 transition-colors">
                <span className="text-xs text-slate-300 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-violet-400" /> Devis envoyés</span>
                <span className="text-right whitespace-nowrap">
                  <span className="text-white text-sm font-bold tabular-nums">{apercu.devisEnvoyesN}</span>
                  <span className="text-slate-500 text-[11px] ml-1.5">{euros(apercu.devisEnvoyesCt)}</span>
                </span>
              </Link>
              {/* Validés (signés), en dessous */}
              <Link href="/admin/leads" className="flex items-center justify-between rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3 py-2.5 hover:border-emerald-500/40 transition-colors">
                <span className="text-xs text-emerald-300 flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Validés (signés)</span>
                <span className="text-right whitespace-nowrap">
                  <span className="text-white text-sm font-bold tabular-nums">{apercu.gagnesN}</span>
                  <span className="text-emerald-400/70 text-[11px] ml-1.5">{euros(apercu.gagnesCt)}</span>
                </span>
              </Link>
            </div>

            {/* Aperçu des contrats de maintenance actifs */}
            <p className="text-slate-500 text-[11px] uppercase tracking-wide mb-2">Contrats de maintenance</p>
            <Link href="/admin/contrats" className="flex items-center justify-between rounded-xl bg-slate-900/40 border border-white/8 px-3 py-2.5 hover:border-sky-500/30 transition-colors">
              <span className="text-xs text-slate-300 flex items-center gap-1.5"><ScrollText className="w-3.5 h-3.5 text-sky-400" /> Actifs</span>
              <span className="text-right whitespace-nowrap">
                <span className="text-white text-sm font-bold tabular-nums">{apercu.contratsActifs}</span>
                <span className="text-slate-500 text-[11px] ml-1.5">{euros(apercu.contratsCaAnnuelCt)}/an</span>
              </span>
            </Link>
          </div>

        </div>

        {/* ─── Audience (7 derniers jours) ───────────────────────────────────────── */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-sky-400" /> Audience, 7 derniers jours
            </h2>
            <Link href="/admin/marketing/statistiques" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1 transition-colors">
              Statistiques détaillées <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {audienceKpis.map((k) => (
              <div key={k.label} className="bg-slate-900/40 border border-white/8 rounded-xl p-3">
                <div className={`w-7 h-7 rounded-lg border flex items-center justify-center mb-2 ${k.color}`}>
                  <k.icon className="w-3.5 h-3.5" />
                </div>
                <p className="text-lg font-bold text-white tabular-nums">{k.value}</p>
                <p className="text-slate-300 text-xs font-medium">{k.label}</p>
                <p className="text-slate-500 text-xs mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>
          <p className="text-slate-600 text-[11px] mt-3">Le suivi des visites démarre maintenant, les chiffres se rempliront au fil du trafic.</p>
        </div>

        {/* ─── Calendrier semaine (masqué sur mobile : grille pensée grand écran ;
              sur mobile, voir « Prochaines interventions » ci-dessus + onglet Planning) ── */}
        <div className="hidden md:block bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-sky-400" /> Planning
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
              { href: "/admin/contrats",      icon: ScrollText,    color: "sky",    title: "Contrats",        sub: "Entretien & maintenance" },
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
