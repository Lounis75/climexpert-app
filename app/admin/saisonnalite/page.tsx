import AdminHeader from "@/components/AdminHeader";
import { db } from "@/lib/db";
import { periodesCapacite } from "@/lib/db/schema";
import SaisonnaliteManager from "./SaisonnaliteManager";

export const dynamic = "force-dynamic";

export default async function SaisonnalitePage() {
  const periodes = await db.select().from(periodesCapacite).orderBy(periodesCapacite.dateDebut);

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Saisonnalité</h1>
          <p className="text-slate-400 text-sm">Gérez les périodes de forte activité et limitez la capacité hebdomadaire.</p>
        </div>
        <SaisonnaliteManager initial={periodes} />
      </main>
    </div>
  );
}
