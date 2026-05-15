import AdminHeader from "@/components/AdminHeader";
import { getFactureById, centimesToEuros, STATUS_FACTURE } from "@/lib/factures";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, FileText, Trash2, CheckCircle } from "lucide-react";
import FactureActions from "./FactureActions";

export const dynamic = "force-dynamic";

export default async function FactureDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const f = await getFactureById(id);
  if (!f) notFound();

  const status = STATUS_FACTURE[f.status] ?? STATUS_FACTURE.en_attente;
  const overdue =
    f.status === "en_attente" && f.dueDate && new Date(f.dueDate) < new Date();

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin/factures" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white">{f.number}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                  {status.label}
                </span>
                {overdue && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border bg-red-500/10 text-red-400 border-red-500/30">
                    En retard
                  </span>
                )}
              </div>
              <p className="text-slate-400 text-sm mt-0.5">
                Créée le {new Date(f.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <FactureActions id={f.id} currentStatus={f.status} />
        </div>

        {/* Infos */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
            <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Client</p>
              <p className="text-white text-sm font-medium">{f.clientName}</p>
            </div>
          </div>
          <div className={`bg-slate-800/40 border rounded-xl px-4 py-3 flex items-center gap-3 ${overdue ? "border-red-500/30" : "border-white/8"}`}>
            <Calendar className={`w-4 h-4 flex-shrink-0 ${overdue ? "text-red-400" : "text-slate-500"}`} />
            <div>
              <p className="text-xs text-slate-500">Date d&apos;échéance</p>
              <p className={`text-sm font-medium ${overdue ? "text-red-400" : "text-white"}`}>
                {f.dueDate ? new Date(f.dueDate).toLocaleDateString("fr-FR") : "—"}
              </p>
            </div>
          </div>
          {f.devisNumber && (
            <div className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
              <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Devis lié</p>
                <p className="text-white text-sm font-medium">{f.devisNumber}</p>
              </div>
            </div>
          )}
          {f.paidAt && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-emerald-500">Payée le</p>
                <p className="text-emerald-300 text-sm font-medium">
                  {new Date(f.paidAt).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Montants */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-6">
          <h2 className="text-white font-semibold text-sm mb-4">Montants</h2>
          <div className="max-w-xs space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total HT</span>
              <span className="text-white tabular-nums">{centimesToEuros(f.totalHtCt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">TVA ({String(f.tvaRate ?? "10")}%)</span>
              <span className="text-white tabular-nums">
                {centimesToEuros((f.totalTtcCt ?? 0) - (f.totalHtCt ?? 0))}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-2 mt-2">
              <span className="text-white">Total TTC</span>
              <span className="text-emerald-400 text-lg tabular-nums">{centimesToEuros(f.totalTtcCt)}</span>
            </div>
          </div>
        </div>

        {/* Supprimer */}
        <div className="flex justify-end">
          <Link
            href="/admin/factures"
            onClick={async (e) => {
              e.preventDefault();
              if (!confirm("Supprimer cette facture définitivement ?")) return;
              await fetch(`/api/admin/factures/${f.id}`, { method: "DELETE" });
              window.location.href = "/admin/factures";
            }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Supprimer cette facture
          </Link>
        </div>

      </main>
    </div>
  );
}
