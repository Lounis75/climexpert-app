import AdminHeader from "@/components/AdminHeader";
import { db } from "@/lib/db";
import { techniciens } from "@/lib/db/schema";
import { isNull, asc } from "drizzle-orm";
import IndisponibilitesManager from "./IndisponibilitesManager";

export const dynamic = "force-dynamic";

// Gestion centralisée des congés / indisponibilités de toute l'équipe (salariés + sous-traitants).
export default async function Page() {
  const team = await db
    .select({
      id: techniciens.id,
      name: techniciens.name,
      prenom: techniciens.prenom,
      externe: techniciens.externe,
      entreprise: techniciens.entreprise,
      specialite: techniciens.specialite,
      color: techniciens.color,
    })
    .from(techniciens)
    .where(isNull(techniciens.supprimeLe))
    .orderBy(asc(techniciens.name));

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <IndisponibilitesManager team={team} />
      </main>
    </div>
  );
}
