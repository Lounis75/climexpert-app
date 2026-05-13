import { getLeads } from "@/lib/leads";
import AdminHeader from "@/components/AdminHeader";
import LeadsManager from "./LeadsManager";

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  const leads = await getLeads();

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Leads CRM</h1>
          <p className="text-slate-400 text-sm">
            Prospects qualifiés par Alex et demandes de contact. Suivez leur avancement et prenez contact directement.
          </p>
        </div>
        <LeadsManager initialLeads={leads} />
      </main>
    </div>
  );
}
