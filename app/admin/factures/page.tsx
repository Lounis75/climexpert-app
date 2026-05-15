import AdminHeader from "@/components/AdminHeader";
import { getFactures, centimesToEuros, STATUS_FACTURE } from "@/lib/factures";
import Link from "next/link";
import { Receipt, Calendar, ArrowRight, AlertCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminFacturesPage() {
  const facturesList = await getFactures();

  const totalEnAttente = facturesList
    .filter((f) => f.status === "en_attente" || f.status === "en_retard")
    .reduce((s, f) => s + (f.totalTtcCt ?? 0), 0);

  const retard = facturesList.filter((f) => {
    if (f.status !== "en_attente") return false;
    if (!f.dueDate) return false;
    return new Date(f.dueDate) < new Date();
  });

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        <div className="mb-8 flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Factures</h1>
            <p className="text-slate-400 text-sm">
              {facturesList.length} facture{facturesList.length > 1 ? "s" : ""} ·{" "}
              <span className="text-amber-400">{centimesToEuros(totalEnAttente)} en attente</span>
            </p>
          </div>
          <Link
            href="/admin/devis"
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-medium rounded-xl transition-all"
          >
            <Receipt className="w-3.5 h-3.5" />
            Créer via un devis
          </Link>
        </div>

        {retard.length > 0 && (
          <div className="mb-6 bg-red-500/10 border border-red-500/25 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-300 text-sm font-semibold mb-0.5">
                {retard.length} facture{retard.length > 1 ? "s" : ""} en retard de paiement
              </p>
              <p className="text-slate-400 text-xs">
                {retard.map((f) => f.number).join(", ")}
              </p>
            </div>
          </div>
        )}

        {facturesList.length === 0 ? (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-white font-semibold mb-2">Aucune facture</h2>
            <p className="text-slate-400 text-sm mb-6">
              Les factures sont générées depuis un devis accepté.
            </p>
            <Link
              href="/admin/devis"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 text-xs font-medium rounded-xl transition-colors"
            >
              Voir les devis
            </Link>
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-[1fr_1.5fr_1fr_120px_110px_100px_32px] gap-3 px-5 py-3 text-xs text-slate-500 border-b border-white/8">
              <span>Numéro</span>
              <span>Client</span>
              <span>Devis lié</span>
              <span>Total TTC</span>
              <span>Échéance</span>
              <span>Statut</span>
              <span />
            </div>

            <div className="divide-y divide-white/5">
              {facturesList.map((f) => {
                const status = STATUS_FACTURE[f.status] ?? STATUS_FACTURE.en_attente;
                const overdue =
                  f.status === "en_attente" &&
                  f.dueDate &&
                  new Date(f.dueDate) < new Date();
                return (
                  <Link
                    key={f.id}
                    href={`/admin/factures/${f.id}`}
                    className="grid sm:grid-cols-[1fr_1.5fr_1fr_120px_110px_100px_32px] grid-cols-1 gap-3 px-5 py-4 items-center hover:bg-white/3 transition-colors group"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                        <Receipt className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-white text-sm font-medium">{f.number}</span>
                    </div>
                    <span className="text-slate-300 text-sm truncate">{f.clientName}</span>
                    <span className="text-slate-500 text-xs">
                      {f.devisNumber ?? <span className="italic">—</span>}
                    </span>
                    <span className="text-white text-sm tabular-nums font-medium">
                      {centimesToEuros(f.totalTtcCt)}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${overdue ? "text-red-400" : "text-slate-500"}`}>
                      <Calendar className="w-3 h-3" />
                      {f.dueDate
                        ? new Date(f.dueDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                        : "—"}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border w-fit ${status.color}`}>
                      {status.label}
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
