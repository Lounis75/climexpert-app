import AdminHeader from "@/components/AdminHeader";
import { getClients } from "@/lib/clients";
import { getTechniciens } from "@/lib/interventions";
import { getChantiers } from "@/lib/chantiers";
import InterventionForm from "../InterventionForm";

export const dynamic = "force-dynamic";

export default async function NewInterventionPage() {
  const [clients, techniciens, chantiersAll] = await Promise.all([getClients(), getTechniciens(), getChantiers()]);
  const chantiers = chantiersAll.map((ch) => ({ id: ch.id, clientId: ch.clientId, nom: ch.nom }));

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <InterventionForm clients={clients} techniciens={techniciens} chantiers={chantiers} />
      </main>
    </div>
  );
}
