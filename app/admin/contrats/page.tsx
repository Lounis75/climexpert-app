import AdminHeader from "@/components/AdminHeader";
import { getContrats } from "@/lib/contrats";
import { getClients } from "@/lib/clients";
import ContratsManager from "./ContratsManager";

export const dynamic = "force-dynamic";

export default async function ContratsPage() {
  const [contrats, clients] = await Promise.all([getContrats(), getClients()]);

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Contrats d&apos;entretien</h1>
          <p className="text-slate-400 text-sm">Suivi des contrats annuels — à partir de 150 € / unité.</p>
        </div>
        <ContratsManager initialContrats={contrats} clients={clients} />
      </main>
    </div>
  );
}
