import AdminHeader from "@/components/AdminHeader";
import Link from "next/link";
import { getRevueById } from "@/lib/revues";
import RevueDetail from "./RevueDetail";

export const dynamic = "force-dynamic";

type Line = { d: string; q: number; pu: number; tva: number };

export default async function RevuePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const r = await getRevueById(id);

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {!r ? (
          <div className="text-center py-16">
            <p className="text-slate-400">Demande introuvable.</p>
            <Link href="/admin/revues" className="text-sky-400 hover:text-sky-300 text-sm mt-2 inline-block">Retour aux demandes</Link>
          </div>
        ) : (
          <RevueDetail
            revue={{
              id: r.id,
              status: r.status,
              description: r.description,
              clientSnapshot: (r.clientSnapshot ?? {}) as Record<string, string>,
              lignes: (Array.isArray(r.lignes) ? r.lignes : []) as Line[],
              photosUrls: r.photosUrls ?? [],
              noteDemande: r.noteDemande,
              demandeParNom: r.demandeParNom,
              noteExpert: r.noteExpert,
              revueParNom: r.revueParNom,
              revueLe: r.revueLe ? new Date(r.revueLe).toISOString() : null,
              montantEnvoyeCt: r.montantEnvoyeCt,
            }}
          />
        )}
      </main>
    </div>
  );
}
