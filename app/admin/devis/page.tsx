import AdminHeader from "@/components/AdminHeader";
import { getDevis } from "@/lib/devis";
import Link from "next/link";
import { Plus } from "lucide-react";
import DevisListClient from "./DevisListClient";

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

        <DevisListClient devisList={devisList} />

      </main>
    </div>
  );
}
