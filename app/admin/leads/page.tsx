import { getLeadsBoard, getLastActivityByLead } from "@/lib/leads";
import AdminHeader from "@/components/AdminHeader";
import LeadsManager from "./LeadsManager";
import CalendrierDashboardWrapper from "@/components/CalendrierDashboardWrapper";
import Link from "next/link";
import { Download, BarChart2, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source } = await searchParams;
  const CAP = 50; // prospects chargés par colonne (le reste via « charger plus »)
  // Kanban paginé : on ne charge plus toute la table, mais les plus récents par colonne
  // + les totaux réels. Les « en production » (gagnés + intervention planifiée) sont exclus.
  const board = await getLeadsBoard(CAP);
  const leads = board.leads;
  const enProductionCount = board.enProductionCount;
  const lastActivity = await getLastActivityByLead(leads.map((l) => l.id));

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-white mb-1">Leads CRM</h1>
            <p className="hidden sm:block text-slate-400 text-sm">
              Prospects qualifiés par Alex et demandes de contact. Suivez leur avancement et prenez contact directement.
            </p>
            {enProductionCount > 0 && (
              <p className="hidden sm:flex text-slate-500 text-xs mt-1.5 items-start gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mt-1 flex-shrink-0" />
                <span>
                  {enProductionCount} prospect{enProductionCount > 1 ? "s" : ""} passé{enProductionCount > 1 ? "s" : ""} en production (intervention planifiée), masqué{enProductionCount > 1 ? "s" : ""} du Kanban, fiche conservée dans <Link href="/admin/clients" className="text-sky-400 hover:text-sky-300 underline underline-offset-2">Clients</Link>.
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-start">
            <Link
              href="/admin/marketing/statistiques"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
            >
              <BarChart2 className="w-3.5 h-3.5" /> Statistiques
            </Link>
            <a
              href="/api/admin/export/leads"
              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </a>
          </div>
        </div>

        {/* ─── Kanban / Liste leads ────────────────────────────────────────────── */}
        {/* Les analytiques (KPIs, pipeline, sources, Alex…) ont été centralisées dans
            Marketing → Statistiques. */}
        <LeadsManager initialLeads={leads} initialSource={source} lastActivity={lastActivity} counts={board.counts} cap={CAP} />

        {/* Planning (doublon du Dashboard) : vérifier qu'un RDV s'est bien posé sans changer de page */}
        <div className="mt-12 pt-8 border-t border-white/8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-sky-400" /> Planning
          </h2>
          <CalendrierDashboardWrapper />
        </div>

      </main>
    </div>
  );
}
