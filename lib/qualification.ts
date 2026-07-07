// Guide de qualification des besoins (clim / PAC), client-safe (pas d'import DB).
// Sert à générer le formulaire (panneau prospect) ET à formater un résumé lisible
// (repris dans la fiche client à la conversion → utile au commercial et au technicien).
// Le formulaire se RAMIFIE selon le type de prestation (entretien / installation / dépannage).

// Tâche manuelle à effectuer pour un prospect/client (checklist du « parcours client »).
export type LeadTache = { id: string; label: string; dueDate?: string | null; fait: boolean };

export type Qualification = {
  // 🏠 Le bien
  typeBien?: string; clientType?: string; siret?: string;
  // 🔧 Prestation
  natureProjet?: string;
  // Entretien (équipement existant à entretenir)
  entretienNbUnites?: string; entretienHauteur?: string; entretienEmplacementUE?: string; entretienMarque?: string; dernierEntretien?: string;
  // Installation (pose neuve)
  nbUnites?: string; copropriete?: string; syndic?: string;
  // Dépannage (panne)
  problemeDescription?: string; depannageMarque?: string;
  // Dépose (retrait d'une clim existante)
  deposeNbUnites?: string; deposeEmplacementUE?: string; deposeHauteur?: string; deposeMarque?: string; deposeReinstallation?: string; deposeMotif?: string;
  // 💶 Commercial
  plagesHoraires?: string; budget?: string; delai?: string; commentConnu?: string;
  // 📝
  note?: string;
  qualifieLe?: string;   // ISO, renseigné au 1er enregistrement
  qualifPlus?: boolean;  // qualification approfondie menée par Alex (tour long accepté)
  // — anciens champs conservés pour ne pas perdre les données déjà saisies (non affichés) —
  surfaceM2?: string; nbPieces?: string; etageAcces?: string;
  equipementExistant?: string; chauffageActuel?: string;
  entretienModele?: string; typeEquipement?: string; emplacementUE?: string; dispoVisite?: string;
};

export type QualifKey = keyof Qualification;

export type QualifField = {
  key: QualifKey;
  label: string;
  type: "text" | "number" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
  full?: boolean; // occupe toute la largeur
  showIf?: (q: Qualification) => boolean; // champ conditionnel
};

export type QualifGroup = { titre: string; emoji: string; champs: QualifField[] };

const estEntretien    = (q: Qualification) => q.natureProjet === "Entretien";
const estInstallation = (q: Qualification) => q.natureProjet === "Installation";
const estDepannage    = (q: Qualification) => q.natureProjet === "Dépannage";
const estDepose       = (q: Qualification) => q.natureProjet === "Dépose";

export const QUALIF_GROUPS: QualifGroup[] = [
  {
    titre: "Le bien", emoji: "🏠", champs: [
      { key: "typeBien",   label: "Type de bien", type: "select", options: ["Maison", "Appartement", "Local commercial", "Bureau", "Autre"] },
      { key: "clientType", label: "Client",       type: "select", options: ["Particulier", "Professionnel"] },
      // Pro -> on demande le SIRET (facilite la facturation et la recherche du client).
      { key: "siret",      label: "N° SIRET (professionnel)", type: "text", placeholder: "ex : 123 456 789 00012", full: true, showIf: (q) => q.clientType === "Professionnel" },
    ],
  },
  {
    titre: "Prestation", emoji: "🔧", champs: [
      { key: "natureProjet", label: "Type de prestation", type: "select", options: ["Installation", "Entretien", "Dépannage", "Dépose"], full: true },

      // ── Entretien : on entretient un équipement déjà installé ──
      { key: "entretienNbUnites",      label: "Nombre d'unités",              type: "number", placeholder: "ex : 3",              showIf: estEntretien },
      { key: "entretienHauteur",       label: "Hauteur d'installation",       type: "text",   placeholder: "ex : 3 m, RDC, R+2",   showIf: estEntretien },
      { key: "entretienEmplacementUE", label: "Emplacement unité extérieure", type: "select", options: ["Balcon", "Jardin", "Façade", "Toiture", "Cour", "À voir sur place"], showIf: estEntretien },
      { key: "entretienMarque",        label: "Marque",                       type: "text",   placeholder: "ex : Daikin, Mitsubishi…", showIf: estEntretien },
      { key: "dernierEntretien",       label: "Dernier entretien",            type: "text",   placeholder: "ex : 2 ans, plus de 3 ans, jamais", showIf: estEntretien },

      // ── Installation : pose neuve ──
      { key: "nbUnites",    label: "Nombre d'unités souhaitées", type: "number", placeholder: "ex : 2",                                 showIf: estInstallation },
      { key: "copropriete", label: "Copropriété ?",              type: "select", options: ["Non", "Oui", "Ne sait pas"],                showIf: estInstallation },
      { key: "syndic",      label: "Syndic (nom / contact)",     type: "text",   placeholder: "ex : Foncia, Citya…", full: true,        showIf: (q) => estInstallation(q) && (q.copropriete === "Oui" || q.typeBien === "Appartement") },

      // ── Dépannage : panne à diagnostiquer ──
      { key: "problemeDescription", label: "Description du problème",       type: "textarea", placeholder: "ex : ne refroidit plus, fuite d'eau, code erreur…", showIf: estDepannage },
      { key: "depannageMarque",     label: "Marque / âge de l'équipement", type: "text",     placeholder: "ex : Daikin, ~6 ans", full: true, showIf: estDepannage },

      // ── Dépose : retrait d'une clim existante (ex : refus de syndic, déménagement) ──
      { key: "deposeNbUnites",       label: "Nombre d'unités à déposer",     type: "number", placeholder: "ex : 1",                    showIf: estDepose },
      { key: "deposeEmplacementUE",  label: "Emplacement unité extérieure",  type: "select", options: ["Balcon", "Jardin", "Façade", "Toiture", "Cour", "À voir sur place"], showIf: estDepose },
      { key: "deposeHauteur",        label: "Hauteur / accès",               type: "text",   placeholder: "ex : 3 m, RDC, R+2, nacelle", showIf: estDepose },
      { key: "deposeMarque",         label: "Marque de l'équipement",        type: "text",   placeholder: "ex : Daikin, Mitsubishi…",  showIf: estDepose },
      { key: "deposeReinstallation", label: "Réinstallation prévue ?",       type: "select", options: ["Non", "Oui, plus tard (même lieu)", "Oui, ailleurs"], showIf: estDepose },
      { key: "deposeMotif",          label: "Motif de la dépose",            type: "text",   placeholder: "ex : refus syndic, déménagement, rénovation…", full: true, showIf: estDepose },
    ],
  },
  {
    titre: "Pour le commercial", emoji: "💶", champs: [
      { key: "plagesHoraires", label: "Plages horaires souhaitées (rappel / RDV)", type: "text", placeholder: "ex : en semaine après 17h, samedi matin", full: true },
      { key: "budget",         label: "Budget envisagé",       type: "text",   placeholder: "ex : ~5 000 €" },
      { key: "delai",          label: "Délai / urgence",       type: "select", options: ["Urgent", "Moins d'1 mois", "1 à 3 mois", "Pas pressé"] },
      { key: "commentConnu",   label: "Comment nous a-t-il connu ?", type: "text", placeholder: "ex : Google, bouche-à-oreille, recommandation…", full: true },
    ],
  },
  // Le bloc « Remarques » a été retiré du guide : les remarques sont désormais la Note interne
  // du prospect (lead.notes), éditable à la fois ici et en bas de la fiche (même base, synchro).
];

/** True si au moins un champ (hors méta) est renseigné. */
export function isQualified(q: Qualification | null | undefined): boolean {
  if (!q) return false;
  return Object.entries(q).some(([k, v]) => k !== "qualifieLe" && typeof v === "string" && v.trim() !== "");
}

/** Résumé lisible (pour la fiche client / briefing technicien). Renvoie "" si vide. */
export function formatQualification(q: Qualification | null | undefined): string {
  if (!isQualified(q)) return "";
  const lines: string[] = ["QUALIFICATION DES BESOINS"];
  for (const g of QUALIF_GROUPS) {
    const parts = g.champs
      .filter((c) => c.key !== "note" && (!c.showIf || c.showIf(q as Qualification)))
      .map((c) => ({ c, v: (q as Qualification)[c.key] }))
      .filter((x) => typeof x.v === "string" && x.v!.trim() !== "")
      .map((x) => `${x.c.label} : ${x.v}`);
    if (parts.length) lines.push(`${g.emoji} ${g.titre}, ${parts.join(" · ")}`);
  }
  const note = q!.note?.trim();
  if (note) lines.push(`📝 Note : ${note}`);
  return lines.join("\n");
}
