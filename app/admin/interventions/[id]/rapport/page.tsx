import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { interventions, clients } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import RapportForm from "@/app/technicien/interventions/[id]/rapport/RapportForm";

export const dynamic = "force-dynamic";

// Clôture côté ADMIN : le gérant remplit le rapport (photos obligatoires, CERFA signé par le
// client, contrat éventuel) à la place du technicien quand il n'a pas pu le faire sur place.
// Réutilise le formulaire du technicien ; les routes /api/technicien/rapports et upload
// acceptent désormais la session admin. L'accès à /admin/* est déjà protégé par le proxy.
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [interv] = await db
    .select({ id: interventions.id, type: interventions.type, clientEmail: clients.email })
    .from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .where(and(eq(interventions.id, id), isNull(interventions.supprimeLe)))
    .limit(1);
  if (!interv) notFound();

  const isVisiteTechnique = interv.type === "autre";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-2xl mx-auto">
        <RapportForm interventionId={id} isVisiteTechnique={isVisiteTechnique} returnTo={`/admin/interventions/${id}`} clientHasEmail={!!interv.clientEmail?.trim()} />
      </div>
    </div>
  );
}
