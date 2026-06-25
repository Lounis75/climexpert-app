import AdminHeader from "@/components/AdminHeader";
import { db } from "@/lib/db";
import { interventions, clients } from "@/lib/db/schema";
import { and, eq, isNull, isNotNull, desc } from "drizzle-orm";
import Link from "next/link";
import { Receipt, AlertTriangle, CheckCircle2, ArrowRight, Wrench } from "lucide-react";

export const dynamic = "force-dynamic";

const fmt = (d?: Date | string | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—");
const TYPE: Record<string, string> = { installation: "Installation", entretien: "Entretien", depannage: "Dépannage", "contrat-pro": "Contrat pro", "rdv-commercial": "RDV commercial", autre: "Autre" };

export default async function FacturationPage() {
  const [aFacturer, envoyees] = await Promise.all([
    db.select({ id: interventions.id, type: interventions.type, completedAt: interventions.completedAt, scheduledAt: interventions.scheduledAt, clientName: clients.name })
      .from(interventions).leftJoin(clients, eq(interventions.clientId, clients.id))
      .where(and(eq(interventions.status, "terminée"), isNull(interventions.factureEnvoyeeLe), isNull(interventions.supprimeLe)))
      .orderBy(desc(interventions.completedAt)),
    db.select({ id: interventions.id, type: interventions.type, factureUrl: interventions.factureUrl, factureEnvoyeeLe: interventions.factureEnvoyeeLe, clientName: clients.name })
      .from(interventions).leftJoin(clients, eq(interventions.clientId, clients.id))
      .where(and(isNotNull(interventions.factureEnvoyeeLe), isNull(interventions.supprimeLe)))
      .orderBy(desc(interventions.factureEnvoyeeLe))
      .limit(40),
  ]);

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Facturation</h1>
          <p className="text-slate-400 text-sm">Interventions terminées à facturer, et suivi des dernières factures envoyées.</p>
        </div>

        <section>
          <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2 mb-3"><AlertTriangle className="w-4 h-4" /> À facturer ({aFacturer.length})</h2>
          {aFacturer.length === 0 ? (
            <p className="bg-slate-800/40 border border-white/8 rounded-2xl p-8 text-center text-slate-500 text-sm">Aucune facture à envoyer. 🎉</p>
          ) : (
            <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/5">
              {aFacturer.map((i) => (
                <Link key={i.id} href={`/admin/interventions/${i.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-white/5 transition-colors group">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0"><Wrench className="w-4 h-4 text-amber-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{i.clientName ?? "Client"}</p>
                    <p className="text-slate-500 text-xs">{TYPE[i.type] ?? i.type} · terminée le {fmt(i.completedAt ?? i.scheduledAt)}</p>
                  </div>
                  <span className="text-amber-300 text-xs font-medium flex-shrink-0 flex items-center gap-1">Envoyer la facture <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" /></span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-sm font-semibold text-emerald-400 flex items-center gap-2 mb-3"><CheckCircle2 className="w-4 h-4" /> Dernières factures envoyées ({envoyees.length})</h2>
          {envoyees.length === 0 ? (
            <p className="bg-slate-800/40 border border-white/8 rounded-2xl p-8 text-center text-slate-500 text-sm">Aucune facture envoyée pour le moment.</p>
          ) : (
            <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/5">
              {envoyees.map((i) => (
                <div key={i.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0"><Receipt className="w-4 h-4 text-emerald-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{i.clientName ?? "Client"}</p>
                    <p className="text-slate-500 text-xs">{TYPE[i.type] ?? i.type} · envoyée le {fmt(i.factureEnvoyeeLe)}</p>
                  </div>
                  {i.factureUrl && <a href={i.factureUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 text-xs font-medium flex-shrink-0">PDF</a>}
                  <Link href={`/admin/interventions/${i.id}`} className="text-slate-500 hover:text-white flex-shrink-0"><ArrowRight className="w-4 h-4" /></Link>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
