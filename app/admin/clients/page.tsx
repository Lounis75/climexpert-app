import { getClientsPaginated, getClientActions, getClientsStats } from "@/lib/clients";
import AdminHeader from "@/components/AdminHeader";
import ClientsManager from "./ClientsManager";
import { Download } from "lucide-react";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function AdminClientsPage() {
  // 1ʳᵉ page seulement — la pagination + recherche se font côté serveur ensuite.
  const [{ items, total }, stats] = await Promise.all([
    getClientsPaginated({ page: 1, limit: PAGE_SIZE }),
    getClientsStats(),
  ]);
  const actions = await getClientActions(items);

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Clients</h1>
            <p className="text-slate-400 text-sm">
              Carnet d&apos;adresses — clients ayant eu une intervention ou un devis.
            </p>
          </div>
          <a
            href="/api/admin/export/clients"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all flex-shrink-0"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </a>
        </div>
        <ClientsManager initialClients={items} initialTotal={total} initialActions={actions} stats={stats} pageSize={PAGE_SIZE} />
      </main>
    </div>
  );
}
