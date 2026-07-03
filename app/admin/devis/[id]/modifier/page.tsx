import AdminHeader from "@/components/AdminHeader";
import { notFound, redirect } from "next/navigation";
import { getDevisById } from "@/lib/devis";
import DevisForm from "../../DevisForm";

export const dynamic = "force-dynamic";

export default async function ModifierDevisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const d = await getDevisById(id);
  if (!d) notFound();
  // Un devis accepté (signé) n'est pas modifiable : on renvoie vers sa fiche.
  if (d.status === "accepté") redirect(`/admin/devis/${id}`);

  // Devis "simple" : le montant TTC est le total ; l'objet = la description.
  const montant = d.totalTtcCt != null ? String(Math.round(d.totalTtcCt / 100)) : "";
  const fichierNom = d.fichierUrl ? (d.fichierUrl.split("/").pop() ?? "Devis joint (PDF)") : null;

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <DevisForm
          clients={[]}
          prospects={[]}
          edit={{
            id: d.id,
            montant,
            objet: d.description ?? "",
            validUntil: d.validUntil ?? "",
            fichierUrl: d.fichierUrl ?? null,
            fichierNom,
            cibleLabel: `${d.clientName ?? "-"}${d.number ? ` · devis ${d.number}` : ""}`,
          }}
        />
      </main>
    </div>
  );
}
