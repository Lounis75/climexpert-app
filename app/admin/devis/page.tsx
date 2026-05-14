import AdminHeader from "@/components/AdminHeader";
import { FileText, Plus, Construction } from "lucide-react";
import Link from "next/link";

export default function AdminDevisPage() {
  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Devis</h1>
            <p className="text-slate-400 text-sm">Gérez vos devis et factures.</p>
          </div>
          <button
            disabled
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-500/20 border border-sky-500/30 text-sky-400/50 text-xs font-semibold rounded-xl cursor-not-allowed"
          >
            <Plus className="w-3.5 h-3.5" />
            Nouveau devis
          </button>
        </div>

        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
            <Construction className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-white font-semibold mb-2">Module devis en cours de développement</h2>
          <p className="text-slate-400 text-sm max-w-sm mx-auto mb-6">
            La création et le suivi de devis seront disponibles prochainement. En attendant, gérez vos prospects depuis les Leads.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/admin/leads"
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 text-xs font-medium rounded-xl transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Voir les leads
            </Link>
            <Link
              href="/admin/clients"
              className="flex items-center gap-1.5 px-4 py-2 bg-white/5 border border-white/10 text-slate-400 hover:text-white text-xs font-medium rounded-xl transition-colors"
            >
              Voir les clients
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
