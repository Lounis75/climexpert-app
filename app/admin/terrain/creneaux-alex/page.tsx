import AdminHeader from "@/components/AdminHeader";
import { CalendarClock } from "lucide-react";
import { getSlotsAdmin } from "@/lib/creneaux-alex";
import { getTechniciens } from "@/lib/techniciens";
import CreneauxAlexManager from "./CreneauxAlexManager";

export const dynamic = "force-dynamic";

export default async function CreneauxAlexPage() {
  const [creneaux, techs] = await Promise.all([getSlotsAdmin(), getTechniciens()]);
  // Attribution facultative d'un créneau à un membre de l'équipe (utile quand il y aura des
  // commerciaux dédiés ; en attendant on liste les techniciens actifs).
  const commerciaux = techs
    .filter((t) => !t.supprimeLe && t.active)
    .map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2"><CalendarClock className="w-6 h-6 text-sky-400" /> Créneaux Alex</h1>
          <p className="text-slate-400 text-sm">Ouvre des créneaux de visite : Alex les propose aux prospects qualifiés et en réserve un automatiquement, avec confirmation au client.</p>
        </div>
        <CreneauxAlexManager
          initial={creneaux.map((c) => ({ id: c.id, debut: new Date(c.debut).toISOString(), fin: new Date(c.fin).toISOString(), statut: c.statut, commercialId: c.commercialId, commercialName: c.commercialName, leadId: c.leadId }))}
          commerciaux={commerciaux}
        />
      </main>
    </div>
  );
}
