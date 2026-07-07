import { Suspense } from "react";
import Link from "next/link";
import {
  Bot, MessageSquare, Users, BarChart2, Repeat2, TrendingUp, TrendingDown,
} from "lucide-react";
import AlexPeriodSelector from "@/components/AlexPeriodSelector";
import type { LeadsPageStats } from "@/lib/dashboard";

const PERIOD_LABELS: Record<string, string> = {
  "1d": "24h", "7d": "7 jours", "1m": "30 jours", "1y": "12 mois", "all": "Tout le temps",
};
const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau", pas_de_reponse: "Pas de réponse", contacté: "Contact établi",
  devis_envoyé: "Devis envoyé", gagné: "Gagné", perdu: "Perdu",
};
const STATUS_COLORS: Record<string, string> = {
  nouveau: "bg-sky-400", pas_de_reponse: "bg-rose-400", contacté: "bg-amber-400",
  devis_envoyé: "bg-violet-400", gagné: "bg-emerald-400", perdu: "bg-slate-400",
};
const STATUS_TEXT: Record<string, string> = {
  nouveau: "text-sky-400", pas_de_reponse: "text-rose-400", contacté: "text-amber-400",
  devis_envoyé: "text-violet-400", gagné: "text-emerald-400", perdu: "text-slate-400",
};
const SOURCE_LABELS: Record<string, string> = {
  alex: "Alex (IA)", formulaire: "Formulaire", téléphone: "Téléphone", autre: "Autre",
};
const SOURCE_COLORS: Record<string, string> = {
  alex: "bg-sky-400", formulaire: "bg-violet-400", téléphone: "bg-amber-400", autre: "bg-slate-400",
};

/** Section analytique des prospects (KPIs CRM, pipeline, sources, tendance, Alex).
 *  Affichée sur la page Statistiques (centralisation). `period` pilote le bloc Alex. */
export default function LeadsAnalytics({ stats, period }: { stats: LeadsPageStats; period: string }) {
  const maxMois = Math.max(...stats.parMois.map((m) => m.total), 1);
  const eur = (ct: number | null) => (ct != null ? `${Math.round(ct / 100).toLocaleString("fr-FR")} €` : "—");
  // Sources triées par volume, pour le tableau « conversion par source ».
  const sourcesConv = Object.entries(stats.conversionParSource).sort((a, b) => b[1].total - a[1].total);

  return (
    <div className="space-y-6">
      {/* ─── Séparateur de section ───────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <div className="flex-1 h-px bg-white/8" />
        <span className="text-xs text-slate-600 font-medium uppercase tracking-widest">CRM, Prospects &amp; pipeline</span>
        <div className="flex-1 h-px bg-white/8" />
      </div>

      {/* ─── KPIs globaux ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total leads", value: stats.total, sub: "depuis le début" },
          { label: "Conversion (traités)", value: `${stats.tauxConversionTraites}%`, sub: `${stats.parStatut.gagné ?? 0} gagnés · hors non appelés` },
          { label: "Signature devis", value: stats.tauxSignatureDevis != null ? `${stats.tauxSignatureDevis}%` : "—", sub: "devis acceptés / envoyés" },
          { label: "Panier moyen", value: eur(stats.panierMoyenCt), sub: "par affaire gagnée" },
        ].map(({ label, value, sub }) => (
          <div key={label} className="bg-slate-800/40 border border-white/8 rounded-2xl p-4">
            <p className="text-2xl font-bold text-white tabular-nums">{value}</p>
            <p className="text-slate-300 text-xs font-medium mt-0.5">{label}</p>
            <p className="text-slate-500 text-xs mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ─── Prospection : conversion par source + délai de traitement ────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm mb-4">Conversion par source</h2>
          <div className="space-y-2.5">
            {sourcesConv.length === 0 && <p className="text-slate-500 text-sm">Pas encore de données.</p>}
            {sourcesConv.map(([src, e]) => (
              <div key={src} className="flex items-center gap-3">
                <span className="text-slate-300 text-xs w-24 capitalize flex-shrink-0">{src}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-700/50 overflow-hidden">
                  <div className="h-full bg-emerald-500/70 rounded-full" style={{ width: `${Math.min(100, e.taux)}%` }} />
                </div>
                <span className="text-white text-xs font-semibold tabular-nums w-24 text-right flex-shrink-0">{e.taux}% · {e.gagne}/{e.total}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5 flex flex-col justify-center">
          <p className="text-slate-400 text-xs">Délai moyen avant premier contact</p>
          <p className="text-3xl font-bold text-white tabular-nums mt-1">{stats.delaiPremierContactJours != null ? `${stats.delaiPremierContactJours} j` : "—"}</p>
          <p className="text-slate-500 text-xs mt-2">Temps entre l&apos;arrivée d&apos;un prospect et sa sortie du statut « Nouveau » (premier appel).</p>
        </div>
      </div>

      {/* ─── Pipeline statuts + Sources ─────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pipeline statuts */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm mb-5">Pipeline leads</h2>
          <div className="space-y-3">
            {["nouveau", "pas_de_reponse", "contacté", "devis_envoyé", "gagné", "perdu"].map((s) => {
              const count = stats.parStatut[s] ?? 0;
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={s}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-xs ${STATUS_TEXT[s]}`}>{STATUS_LABELS[s]}</span>
                    <span className="text-white text-xs font-medium tabular-nums">{count}</span>
                  </div>
                  <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                    <div className={`h-full ${STATUS_COLORS[s]} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {stats.total > 0 && (
            <div className="mt-5 pt-4 border-t border-white/8 flex gap-6">
              <div>
                <p className="text-slate-500 text-xs">Taux de gain (traités)</p>
                <p className="text-white text-xl font-bold mt-0.5">{stats.tauxConversionTraites}%</p>
              </div>
              <div>
                <p className="text-slate-500 text-xs">En cours</p>
                <p className="text-white text-xl font-bold mt-0.5">
                  {(stats.parStatut.nouveau ?? 0) + (stats.parStatut.pas_de_reponse ?? 0) + (stats.parStatut.contacté ?? 0) + (stats.parStatut.devis_envoyé ?? 0)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sources */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm mb-5">Sources des leads</h2>
          <div className="space-y-3">
            {Object.entries(stats.parSource).sort((a, b) => b[1] - a[1]).map(([src, count]) => {
              const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={src}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-slate-300 text-xs">{SOURCE_LABELS[src] ?? src}</span>
                    <span className="text-white text-xs font-medium tabular-nums">{count} · {pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${SOURCE_COLORS[src] ?? "bg-slate-400"} rounded-full transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
            {Object.keys(stats.parSource).length === 0 && (
              <p className="text-slate-600 text-xs text-center py-6">Aucun lead enregistré</p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Tendance mensuelle ─────────────────────────────────────────────── */}
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
        <h2 className="text-white font-semibold text-sm mb-5">Leads par mois, 8 derniers mois</h2>
        <div className="flex items-end gap-2" style={{ height: "100px" }}>
          {stats.parMois.map(({ mois, total: t, alex: a }) => {
            const pct = Math.round((t / maxMois) * 100);
            const alexPct = t > 0 ? Math.round((a / t) * 100) : 0;
            return (
              <div key={mois} className="flex-1 flex flex-col items-center gap-1.5">
                {t > 0 && (
                  <span className="text-[9px] text-slate-500 tabular-nums">{t}</span>
                )}
                <div className="w-full flex items-end rounded-t-lg overflow-hidden" style={{ height: "64px" }}>
                  <div
                    className="w-full relative overflow-hidden rounded-t-lg"
                    style={{ height: `${Math.max(pct, t > 0 ? 8 : 3)}%` }}
                  >
                    <div className="absolute bottom-0 left-0 right-0 bg-sky-500/50" style={{ height: `${alexPct}%` }} />
                    <div className="absolute top-0 left-0 right-0 bg-violet-500/40" style={{ height: `${100 - alexPct}%` }} />
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 text-center">{mois}</span>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-4 mt-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500/50 inline-block" />Alex
          </span>
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500/40 inline-block" />Formulaire
          </span>
        </div>
      </div>

      {/* ─── Alex, Chatbot IA ──────────────────────────────────────────────── */}
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between gap-3 flex-wrap">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-400" /> Alex, Chatbot IA
          </h2>
          <Suspense fallback={<span className="text-[10px] text-slate-500">{PERIOD_LABELS[period]}</span>}>
            <AlexPeriodSelector current={period} />
          </Suspense>
        </div>
        <div className="p-5">
          {stats.alex.conversationsTotal === 0 ? (
            <div className="text-center py-8 text-slate-600">
              <Bot className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Aucune conversation enregistrée pour l&apos;instant.</p>
              <p className="text-xs mt-1 opacity-60">Les stats apparaîtront dès qu&apos;un visiteur utilise Alex.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                <div className="rounded-xl border p-4 bg-violet-500/10 border-violet-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-slate-400 text-xs">Conversations</span>
                  </div>
                  <p className="text-2xl font-bold text-violet-400">{stats.alex.conversationsTotal}</p>
                </div>

                <div className="rounded-xl border p-4 bg-emerald-500/10 border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-slate-400 text-xs">Leads générés</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-400">{stats.alex.leadsGeneresPeriode.length}</p>
                  {stats.alex.leadsGeneresPeriode.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-emerald-500/20 pt-3">
                      {stats.alex.leadsGeneresPeriode.map((l) => (
                        <Link key={l.id} href={`/admin/leads?source=alex`} className="flex items-center gap-1.5 group">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_COLORS[l.status] ?? "bg-slate-400"}`} />
                          <span className="text-xs text-emerald-300 group-hover:text-white transition-colors truncate">{l.name}</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-xl border p-4 bg-sky-500/10 border-sky-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
                    <span className="text-slate-400 text-xs">Taux de conv.</span>
                  </div>
                  <p className="text-2xl font-bold text-sky-400">{stats.alex.tauxConversion}%</p>
                </div>

                <div className="rounded-xl border p-4 bg-amber-500/10 border-amber-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat2 className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-400 text-xs">Messages total</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-400">{stats.alex.messagesTotal}</p>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-xl p-4 flex items-center justify-between">
                <Link href="/admin/leads?source=alex" className="group">
                  <p className="text-slate-400 text-xs mb-0.5">Leads cette semaine</p>
                  <p className="text-white font-bold text-xl group-hover:text-violet-300 transition-colors underline decoration-dotted underline-offset-2 decoration-slate-600 group-hover:decoration-violet-500">
                    {stats.alex.conversionCetteSemaine}
                  </p>
                </Link>
                <div className="text-right">
                  <p className="text-slate-400 text-xs mb-0.5">Semaine précédente</p>
                  <p className="text-slate-300 font-semibold text-xl">{stats.alex.conversionSemainePrecedente}</p>
                </div>
                <div className="text-right">
                  <p className="text-slate-400 text-xs mb-1">Tendance</p>
                  {stats.alex.conversionSemainePrecedente === 0 ? (
                    <span className="text-slate-500 text-xs">-</span>
                  ) : stats.alex.conversionCetteSemaine >= stats.alex.conversionSemainePrecedente ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3 h-3" />
                      +{stats.alex.conversionCetteSemaine - stats.alex.conversionSemainePrecedente}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-full">
                      <TrendingDown className="w-3 h-3" />
                      {stats.alex.conversionCetteSemaine - stats.alex.conversionSemainePrecedente}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
