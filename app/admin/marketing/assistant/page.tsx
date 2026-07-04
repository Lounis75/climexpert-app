import AdminHeader from "@/components/AdminHeader";
import { Bot, MessagesSquare, UserCheck, Sparkles, CalendarClock, EyeOff } from "lucide-react";
import { getAlexConsignes } from "@/lib/alex-consignes";
import { getAlexStats, getAbandonSessions } from "@/lib/alex-stats";
import ConsignesEditor from "./ConsignesEditor";

export const dynamic = "force-dynamic";

function fmtDate(d: Date): string {
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" }) +
    " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
}

export default async function AssistantAlexPage() {
  const [consignes, stats, abandons] = await Promise.all([getAlexConsignes(), getAlexStats(), getAbandonSessions()]);

  const tuiles = [
    { icon: MessagesSquare, label: "Conversations", v7: stats.conversations7j as number | undefined, v30: stats.conversations30j },
    { icon: UserCheck, label: "Prospects captés", v7: stats.leads7j as number | undefined, v30: stats.leads30j },
    { icon: Sparkles, label: "Qualifs approfondies (30 j)", v7: undefined, v30: stats.qualifPlus30j },
    { icon: CalendarClock, label: "RDV posés par Alex (30 j)", v7: undefined, v30: stats.rdvAlex30j },
  ];

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2"><Bot className="w-6 h-6 text-sky-400" /> Assistant Alex</h1>
          <p className="text-slate-400 text-sm">Pilote ce qu&apos;Alex dit aux clients : le délai d&apos;intervention du moment et tes consignes. Modifiable à tout moment, appliqué partout instantanément.</p>
        </div>

        {/* Activité */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Activité</p>
          <div className="grid grid-cols-2 gap-2.5">
            {tuiles.map((t) => (
              <div key={t.label} className="bg-slate-800/40 border border-white/8 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-slate-400 text-xs mb-1.5"><t.icon className="w-3.5 h-3.5 text-sky-400" /> {t.label}</div>
                <p className="text-white text-2xl font-bold">
                  {t.v30}
                  {typeof t.v7 === "number" && <span className="text-slate-500 text-sm font-medium ml-2">dont {t.v7} sur 7 j</span>}
                </p>
              </div>
            ))}
          </div>
          {stats.tauxCompletion30j !== null && (
            <p className="text-slate-500 text-xs mt-2">
              Taux de complétion sur 30 jours : <span className="text-slate-300 font-semibold">{stats.tauxCompletion30j} %</span> des conversations aboutissent à un prospect enregistré.
            </p>
          )}
        </section>

        {/* Conversations abandonnées : où décrochent-ils ? */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
            <EyeOff className="w-3.5 h-3.5" /> Conversations abandonnées (14 derniers jours)
          </p>
          {abandons.length === 0 ? (
            <p className="text-slate-500 text-sm">Aucune conversation abandonnée récente. 👌</p>
          ) : (
            <div className="space-y-2">
              <p className="text-slate-500 text-xs">Le visiteur a discuté puis est parti sans laisser ses coordonnées. Les lire montre où ça décroche (question posée trop tôt, prix, hésitation...).</p>
              {abandons.map((a) => (
                <details key={a.sessionId} className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3 group">
                  <summary className="cursor-pointer text-sm text-slate-300 flex items-center justify-between gap-2 list-none">
                    <span>Conversation du {fmtDate(a.dernierMessage)} · {a.echanges.length} échange{a.echanges.length > 1 ? "s" : ""}</span>
                    <span className="text-slate-500 text-xs group-open:hidden">voir</span>
                  </summary>
                  <div className="mt-3 space-y-2 border-t border-white/5 pt-3">
                    {a.echanges.map((e, i) => (
                      <div key={i} className="text-xs space-y-1">
                        {e.question && <p className="text-sky-300"><span className="text-slate-500">Client :</span> {e.question}</p>}
                        {e.reponse && <p className="text-slate-400"><span className="text-slate-600">Alex :</span> {e.reponse}</p>}
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </section>

        <ConsignesEditor initial={{ delaiJours: consignes.delaiJours, consignes: consignes.consignes }} />
      </main>
    </div>
  );
}
