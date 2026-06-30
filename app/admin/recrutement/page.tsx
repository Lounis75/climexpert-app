import AdminHeader from "@/components/AdminHeader";
import Link from "next/link";
import { Briefcase, ExternalLink } from "lucide-react";
import { getOffres } from "@/lib/emplois";
import RecrutementManager from "./RecrutementManager";

export const dynamic = "force-dynamic";

export default async function AdminRecrutementPage() {
  const offres = await getOffres();
  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2"><Briefcase className="w-6 h-6 text-sky-400" /> Recrutement</h1>
            <p className="text-slate-400 text-sm">Gère les annonces affichées sur la page publique « Nous recrutons ». Les candidatures arrivent par e-mail et en notification.</p>
          </div>
          <Link href="/recrutement" target="_blank" className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/60 border border-white/10 text-slate-200 hover:border-sky-500/40 hover:text-white text-xs font-semibold transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Voir la page
          </Link>
        </div>
        <RecrutementManager initial={offres} />
      </main>
    </div>
  );
}
