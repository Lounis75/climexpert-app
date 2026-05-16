import { getLeads } from "@/lib/leads";
import AdminHeader from "@/components/AdminHeader";
import LeadsManager from "./LeadsManager";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const leads = await getLeads();

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Leads CRM</h1>
            <p className="text-slate-400 text-sm">
              Prospects qualifiés par Alex et demandes de contact. Suivez leur avancement et prenez contact directement.
            </p>
          </div>
          <a
            href="/api/admin/export/leads"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
        </div>
        <LeadsManager initialLeads={leads} />
      </main>
    </div>
  );
}
