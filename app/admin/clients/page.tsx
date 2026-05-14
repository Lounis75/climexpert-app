import { getClients } from "@/lib/clients";
import AdminHeader from "@/components/AdminHeader";
import ClientsManager from "./ClientsManager";

export const dynamic = "force-dynamic";

export default async function AdminClientsPage() {
  const clients = await getClients();

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Clients</h1>
          <p className="text-slate-400 text-sm">
            Carnet d&apos;adresses — clients ayant eu une intervention ou un devis.
          </p>
        </div>
        <ClientsManager initialClients={clients} />
      </main>
    </div>
  );
}
