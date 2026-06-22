// Guide de qualification des besoins (clim / PAC) — client-safe (pas d'import DB).
// Sert à générer le formulaire (panneau prospect) ET à formater un résumé lisible
// (repris dans la fiche client à la conversion → utile au commercial et au technicien).

export type Qualification = {
  // 🏠 Le bien
  typeBien?: string; surfaceM2?: string; nbPieces?: string; etageAcces?: string; copropriete?: string;
  // 🔧 Le projet
  natureProjet?: string; equipementExistant?: string; chauffageActuel?: string;
  // ❄️ L'équipement souhaité
  typeEquipement?: string; nbUnites?: string; emplacementUE?: string;
  // 💶 Commercial
  budget?: string; delai?: string; dispoVisite?: string; commentConnu?: string;
  // 📝
  note?: string;
  qualifieLe?: string; // ISO — renseigné au 1er enregistrement
};

export type QualifKey = keyof Qualification;

export type QualifField = {
  key: QualifKey;
  label: string;
  type: "text" | "number" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
  full?: boolean; // occupe toute la largeur
};

export type QualifGroup = { titre: string; emoji: string; champs: QualifField[] };

export const QUALIF_GROUPS: QualifGroup[] = [
  {
    titre: "Le bien", emoji: "🏠", champs: [
      { key: "typeBien", label: "Type de bien", type: "select", options: ["Maison", "Appartement", "Local commercial", "Bureau", "Autre"] },
      { key: "surfaceM2", label: "Surface à traiter (m²)", type: "number", placeholder: "ex : 80" },
      { key: "nbPieces", label: "Nombre de pièces à équiper", type: "number", placeholder: "ex : 4" },
      { key: "copropriete", label: "Copropriété ?", type: "select", options: ["Non", "Oui (autorisation à prévoir)", "Ne sait pas"] },
      { key: "etageAcces", label: "Étage & accès (ascenseur, contraintes)", type: "text", placeholder: "ex : 3e avec ascenseur", full: true },
    ],
  },
  {
    titre: "Le projet", emoji: "🔧", champs: [
      { key: "natureProjet", label: "Nature du projet", type: "select", options: ["Installation neuve", "Remplacement", "Ajout d'unité", "Entretien", "Dépannage"] },
      { key: "chauffageActuel", label: "Chauffage actuel", type: "select", options: ["Électrique", "Gaz", "Fioul", "Pompe à chaleur", "Autre"] },
      { key: "equipementExistant", label: "Équipement existant (marque, âge, en panne ?)", type: "text", placeholder: "ex : Daikin 8 ans, en panne", full: true },
    ],
  },
  {
    titre: "L'équipement souhaité", emoji: "❄️", champs: [
      { key: "typeEquipement", label: "Type souhaité", type: "select", options: ["Mono-split", "Multi-split", "Gainable", "PAC air-air", "PAC air-eau", "Ne sait pas"] },
      { key: "nbUnites", label: "Nombre d'unités", type: "number", placeholder: "ex : 3" },
      { key: "emplacementUE", label: "Emplacement unité extérieure", type: "select", options: ["Balcon", "Jardin", "Façade", "Toiture", "À voir sur place"] },
    ],
  },
  {
    titre: "Commercial", emoji: "💶", champs: [
      { key: "budget", label: "Budget envisagé", type: "text", placeholder: "ex : ~5 000 €" },
      { key: "delai", label: "Délai / urgence", type: "select", options: ["Urgent", "Moins d'1 mois", "1 à 3 mois", "Pas pressé"] },
      { key: "dispoVisite", label: "Dispo pour une visite technique", type: "text", placeholder: "ex : en semaine après 17h" },
      { key: "commentConnu", label: "Comment nous a-t-il connu ?", type: "text", placeholder: "ex : Google, bouche-à-oreille…" },
    ],
  },
  {
    titre: "Notes", emoji: "📝", champs: [
      { key: "note", label: "Notes libres (précisions, contexte…)", type: "textarea", full: true },
    ],
  },
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
      .filter((c) => c.key !== "note")
      .map((c) => ({ c, v: (q as Qualification)[c.key] }))
      .filter((x) => typeof x.v === "string" && x.v!.trim() !== "")
      .map((x) => `${x.c.label} : ${x.v}`);
    if (parts.length) lines.push(`${g.emoji} ${g.titre} — ${parts.join(" · ")}`);
  }
  const note = q!.note?.trim();
  if (note) lines.push(`📝 Note : ${note}`);
  return lines.join("\n");
}
