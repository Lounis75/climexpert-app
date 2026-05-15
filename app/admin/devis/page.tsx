import AdminHeader from "@/components/AdminHeader";
import { getDevis, centimesToEuros, STATUS_DEVIS } from "@/lib/devis";
import Link from "next/link";
import { Plus, FileText, ArrowRight, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDevisPage() {
  const devisList = await getDevis();

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Devis</h1>
            <p className="text-slate-400 text-sm">
              {devisList.length} devis au total
            </p>
          </div>
          <Link
            href="/admin/devis/new"
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau devis
          </Link>
        </div>

        {devisList.length === 0 ? (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-5 h-5 text-sky-400" />
            </div>
            <h2 className="text-white font-semibold mb-2">Aucun devis</h2>
            <p className="text-slate-400 text-sm mb-6">Créez votre premier devis en cliquant sur le bouton ci-dessus.</p>
            <Link
              href="/admin/devis/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Nouveau devis
            </Link>
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            {/* Thead */}
            <div className="hidden sm:grid grid-cols-[1fr_1.5fr_130px_120px_100px_32px] gap-4 px-5 py-3 text-xs text-slate-500 border-b border-white/8">
              <span>Numéro</span>
              <span>Client</span>
              <span>Statut</span>
              <span>Total TTC</span>
              <span>Date</span>
              <span />
            </div>

            <div className="divide-y divide-white/5">
              {devisList.map((d) => {
                const status = STATUS_DEVIS[d.status] ?? STATUS_DEVIS.brouillon;
                return (
                  <Link
                    key={d.id}
                    href={`/admin/devis/${d.id}`}
                    className="grid sm:grid-cols-[1fr_1.5fr_130px_120px_100px_32px] grid-cols-1 gap-4 px-5 py-4 items-center hover:bg-white/3 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-white text-sm font-medium">{d.number}</span>
                    </div>
                    <span className="text-slate-300 text-sm truncate">{d.clientName}</span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border w-fit ${status.color}`}>
                      {status.label}
                    </span>
                    <span className="text-white text-sm tabular-nums font-medium">
                      {centimesToEuros(d.totalTtcCt)}
                    </span>
                    <span className="text-slate-500 text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors justify-self-center" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
