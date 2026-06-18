import AdminHeader from "@/components/AdminHeader";
import { getClients } from "@/lib/clients";
import { getLeads } from "@/lib/leads";
import DevisForm from "../DevisForm";
import Link from "next/link";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewDevisPage() {
  const [clients, leads] = await Promise.all([getClients(), getLeads()]);
  // Prospects = leads non encore convertis en client et non perdus
  const prospects = leads
    .filter((l) => !l.clientId && l.status !== "perdu")
    .map((l) => ({ id: l.id, name: l.name, location: l.location }));

  const hasTargets = clients.length > 0 || prospects.length > 0;

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {!hasTargets ? (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-12 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <h2 className="text-white font-semibold mb-2">Aucun prospect ni client</h2>
            <p className="text-slate-400 text-sm mb-6">
              Ajoutez d&apos;abord un prospect (dans le CRM) ou un client.
            </p>
            <Link
              href="/admin/leads"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 text-xs font-medium rounded-xl transition-colors"
            >
              Voir les prospects
            </Link>
          </div>
        ) : (
          <DevisForm clients={clients} prospects={prospects} />
        )}
      </main>
    </div>
  );
}
