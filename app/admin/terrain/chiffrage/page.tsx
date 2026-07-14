import AdminHeader from "@/components/AdminHeader";
import { getCatalogue, type ChiffragePrefill, type ChiffrageDraft, type Prestation } from "@/lib/catalogue";
import { getLeadById } from "@/lib/leads";
import { getClientById } from "@/lib/clients";
import type { Lead } from "@/lib/leads";
import type { Client } from "@/lib/clients";
import type { Qualification } from "@/lib/qualification";
import ChiffrageTool from "./ChiffrageTool";

export const dynamic = "force-dynamic";

const PRESTA: Record<string, Prestation> = {
  Installation: "installation", Entretien: "entretien", "Dépannage": "depannage", "Dépose": "depose",
  installation: "installation", entretien: "entretien", depannage: "depannage", depose: "depose",
  "contrat-pro": "entretien", autre: "autre",
};
function mapPrestation(s: string | undefined | null): Prestation {
  return (s && PRESTA[s]) || "installation";
}

// Découpe une location "75015 Paris" en { cp, ville }.
function splitLocation(loc: string): { cp: string; ville: string } {
  const m = loc.match(/(\d{5})\s*(.*)/);
  return m ? { cp: m[1], ville: m[2].trim() } : { cp: "", ville: loc };
}

// Construit le pré-remplissage de l'outil à partir d'un prospect (infos client + qualification).
function buildPrefill(lead: Lead): ChiffragePrefill {
  const q = (lead.qualification ?? {}) as Qualification;
  const l = lead as Lead & { address?: string | null; typeClient?: string | null; typeBatiment?: string | null; entreprise?: string | null; siren?: string | null };
  const { cp, ville } = splitLocation(lead.location ?? "");
  const nb = parseInt(q.nbUnites || q.entretienNbUnites || q.deposeNbUnites || "", 10) || 1;
  const immeuble = q.copropriete === "Oui" || q.typeBien === "Appartement" || ["appartement", "copropriete"].includes(l.typeBatiment ?? "");
  const depose = q.natureProjet === "Dépose" || !!q.deposeNbUnites;
  const pro = q.clientType === "Professionnel" || l.typeClient === "professionnel";
  const prestation: Prestation = mapPrestation(q.natureProjet) ?? (lead.project === "entretien" ? "entretien" : lead.project === "depannage" ? "depannage" : "installation");
  // Majoration entretien : pré-cochée si la qualification indique un dernier entretien
  // de plus de 3 ans (ou jamais fait). "3 ans" pile n'est pas > 3 ans.
  const plus3ans = /jamais|plus de 3|[4-9]\s*ans|\d{2,}\s*ans/i.test(q.dernierEntretien ?? "");
  return {
    leadId: lead.id,
    client: { nom: lead.name ?? "", tel: lead.phone ?? "", email: lead.email ?? "", adr: l.address ?? "", cp, ville, entreprise: l.entreprise ?? "", siren: l.siren ?? "" },
    clientType: pro ? "pro" : "particulier",
    prestation,
    nbRooms: Math.min(Math.max(nb, 1), 8),
    // Groupes extérieurs captés par Alex (entretien) : un groupe supplémentaire renchérit le devis
    // de 100 €, il ne doit pas être oublié au chiffrage.
    nbExterieures: Math.min(Math.max(parseInt(q.entretienNbExterieures ?? "", 10) || 1, 1), 8),
    immeuble: !!immeuble,
    depose: !!depose,
    plus3ans,
  };
}

// Pré-remplissage à partir d'un CLIENT existant (devis lancé depuis « Nouveau devis »). On garde
// clientId pour qu'à l'acceptation le devis se rattache au client sans créer de doublon.
function buildPrefillFromClient(c: Client, prestation: string | undefined): ChiffragePrefill {
  const pro = c.typeClient !== "particulier";
  return {
    clientId: c.id,
    client: { nom: c.name ?? "", tel: c.phone ?? "", email: c.email ?? "", adr: c.address ?? "", cp: "", ville: c.city ?? "", entreprise: pro ? (c.name ?? "") : "", siren: c.siret ?? "" },
    clientType: pro ? "pro" : "particulier",
    prestation: mapPrestation(prestation),
    nbRooms: 1, immeuble: false, depose: false,
  };
}

// Pré-remplissage à partir d'un NOUVEAU contact (champs passés en query depuis « Nouveau devis »).
function buildPrefillFromParams(sp: Record<string, string | undefined>): ChiffragePrefill {
  return {
    client: { nom: sp.nom ?? "", tel: sp.tel ?? "", email: sp.email ?? "", adr: sp.adr ?? "", cp: sp.cp ?? "", ville: sp.ville ?? "", entreprise: "", siren: "" },
    clientType: "particulier",
    prestation: mapPrestation(sp.prestation),
    nbRooms: 1, immeuble: false, depose: false,
  };
}

type SP = { lead?: string; client?: string; nom?: string; tel?: string; email?: string; adr?: string; cp?: string; ville?: string; prestation?: string };

export default async function ChiffragePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const leadId = sp.lead;
  const clientId = sp.client;
  const [catalogue, lead, clientRec] = await Promise.all([
    getCatalogue(),
    leadId ? getLeadById(leadId) : Promise.resolve(null),
    !leadId && clientId ? getClientById(clientId) : Promise.resolve(null),
  ]);
  // Un brouillon enregistré prend le dessus (restauration complète) ; sinon pré-remplissage léger.
  const draft = (lead?.chiffrageBrouillon as ChiffrageDraft | null | undefined) ?? null;
  let prefill: ChiffragePrefill | null = null;
  if (lead && !draft) prefill = buildPrefill(lead);
  else if (clientRec) prefill = buildPrefillFromClient(clientRec, sp.prestation);
  else if (!lead && (sp.nom || sp.tel || sp.email)) prefill = buildPrefillFromParams(sp);

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
