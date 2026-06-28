import AdminHeader from "@/components/AdminHeader";
import { getCatalogue, type ChiffragePrefill, type ChiffrageDraft } from "@/lib/catalogue";
import { getLeadById } from "@/lib/leads";
import type { Lead } from "@/lib/leads";
import type { Qualification } from "@/lib/qualification";
import ChiffrageTool from "./ChiffrageTool";

export const dynamic = "force-dynamic";

// Construit le pré-remplissage de l'outil à partir d'un prospect (infos client + qualification).
function buildPrefill(lead: Lead): ChiffragePrefill {
  const q = (lead.qualification ?? {}) as Qualification;
  const l = lead as Lead & { address?: string | null; typeClient?: string | null; typeBatiment?: string | null; entreprise?: string | null; siren?: string | null };
  const loc = lead.location ?? "";
  const m = loc.match(/(\d{5})\s*(.*)/);
  const cp = m ? m[1] : "";
  const ville = m ? m[2].trim() : loc;
  const nb = parseInt(q.nbUnites || q.entretienNbUnites || q.deposeNbUnites || "", 10) || 1;
  const immeuble = q.copropriete === "Oui" || q.typeBien === "Appartement" || ["appartement", "copropriete"].includes(l.typeBatiment ?? "");
  const depose = q.natureProjet === "Dépose" || !!q.deposeNbUnites;
  const pro = q.clientType === "Professionnel" || l.typeClient === "professionnel";
  return {
    leadId: lead.id,
    client: { nom: lead.name ?? "", tel: lead.phone ?? "", email: lead.email ?? "", adr: l.address ?? "", cp, ville, entreprise: l.entreprise ?? "", siren: l.siren ?? "" },
    clientType: pro ? "pro" : "particulier",
    nbRooms: Math.min(Math.max(nb, 1), 8),
    immeuble: !!immeuble,
    depose: !!depose,
  };
}

export default async function ChiffragePage({ searchParams }: { searchParams: Promise<{ lead?: string }> }) {
  const { lead: leadId } = await searchParams;
  const [catalogue, lead] = await Promise.all([getCatalogue(), leadId ? getLeadById(leadId) : Promise.resolve(null)]);
  // Un brouillon enregistré prend le dessus (restauration complète) ; sinon pré-remplissage léger.
  const draft = (lead?.chiffrageBrouillon as ChiffrageDraft | null | undefined) ?? null;
  const prefill = lead && !draft ? buildPrefill(lead) : null;
  return (
    <div className="min-h-screen bg-[#080d18]">
      <div className="print:hidden"><AdminHeader /></div>
      <main className="bg-[#F5F7FA] min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-[880px] mx-auto mb-4 print:hidden">
          <h1 className="text-xl font-bold text-[#0F1B2D]">Chiffrage terrain</h1>
          <p className="text-sm text-[#6A7686]">Le commercial remplit, l&apos;outil dimensionne et chiffre le devis.</p>
        </div>
        <ChiffrageTool catalogue={catalogue} prefill={prefill} draft={draft} />
      </main>
    </div>
  );
}
