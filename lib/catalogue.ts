// Catalogue de prix du chiffrage terrain (matériel + postes annexes + main d'œuvre).
// Source de vérité unique, stockée dans R2 : un admin la modifie une fois, l'outil de devis
// (admin + commerciaux) la récupère. Valeurs par défaut = prix réels ClimExpert (base V1).
// Méthode : prix de vente HT = coût d'achat HT × coefficient de marge (1,265 calibré sur un cas réel).

import { r2GetJSON, r2PutJSON } from "@/lib/r2";

const CATALOGUE_KEY = "config/catalogue-devis.json";

export type Brand = { id: string; name: string; pos: string; db: string; lowNoise: boolean };
export type EquipItem = { label: string; p: Record<string, number> }; // prix de vente HT par marque
export type AnnexItem = { label: string; v: number };

export type Catalogue = {
  brands: Brand[];
  equip: Record<string, EquipItem>;
  annex: Record<string, AnnexItem>;
  forfaits: Record<string, AnnexItem>; // tarifs des prestations hors installation (entretien/dépannage/dépose)
  moRate: number;       // main d'œuvre €/heure
  marginCoeff: number;  // coefficient appliqué au coût d'achat pour obtenir le prix de vente
  updatedAt?: string;
};

export type Prestation = "installation" | "entretien" | "depannage" | "depose" | "autre";

// ─── Valeurs par défaut (prix réels relevés le 28 juin 2026) ───
export const DEFAULT_CATALOGUE: Catalogue = {
  brands: [
    { id: "hisense",    name: "Hisense",    pos: "Entrée",       db: "~50-54 dB", lowNoise: false },
    { id: "atlantic",   name: "Atlantic",   pos: "Entrée-moyen", db: "~48-52 dB", lowNoise: false },
    { id: "lg",         name: "LG",         pos: "Moyen",        db: "~46-49 dB", lowNoise: true },
    { id: "mitsubishi", name: "Mitsubishi", pos: "Moyen-haut",   db: "~46-49 dB", lowNoise: true },
    { id: "samsung",    name: "Samsung",    pos: "Moyen-haut",   db: "~46-49 dB", lowNoise: true },
    { id: "daikin",     name: "Daikin",     pos: "Haut",         db: "~45-48 dB", lowNoise: true },
  ],
  equip: {
    mono_9000:    { label: "Mono-split mural 2,5 kW / 9 000 BTU",  p: { hisense: 582,  atlantic: 784,  lg: 784,  mitsubishi: 736,  daikin: 894, samsung: 820 } },
    mono_12000:   { label: "Mono-split mural 3,5 kW / 12 000 BTU", p: { hisense: 708,  atlantic: 961,  lg: 961,  mitsubishi: 886,  daikin: 1088, samsung: 1010 } },
    mono_18000:   { label: "Mono-split mural 5 kW / 18 000 BTU",   p: { hisense: 961,  atlantic: 1240, lg: 1265, mitsubishi: 1240, daikin: 1379, samsung: 1300 } },
    mono_24000:   { label: "Mono-split mural 7 kW / 24 000 BTU",   p: { hisense: 1240, atlantic: 1645, lg: 1708, mitsubishi: 1898, daikin: 1834, samsung: 1790 } },
    bi_9_9:       { label: "Bi-split 9 000 + 9 000 BTU",           p: { hisense: 1550, atlantic: 1750, lg: 1750, mitsubishi: 1999, daikin: 2300, samsung: 2050 } },
    bi_9_12:      { label: "Bi-split 9 000 + 12 000 BTU",          p: { hisense: 2300, atlantic: 2600, lg: 2600, mitsubishi: 2990, daikin: 3300, samsung: 2950 } },
    bi_12_12:     { label: "Bi-split 12 000 + 12 000 BTU",         p: { hisense: 2426, atlantic: 2777, lg: 2777, mitsubishi: 3140, daikin: 3494, samsung: 3150 } },
    bi_9_18:      { label: "Bi-split 9 000 + 18 000 BTU",          p: { hisense: 2553, atlantic: 2879, lg: 2904, mitsubishi: 3344, daikin: 3591, samsung: 3350 } },
    bi_12_18:     { label: "Bi-split 12 000 + 18 000 BTU",         p: { hisense: 2679, atlantic: 3056, lg: 3081, mitsubishi: 3494, daikin: 3785, samsung: 3500 } },
    bi_18_18:     { label: "Bi-split 18 000 + 18 000 BTU",         p: { hisense: 2932, atlantic: 3335, lg: 3385, mitsubishi: 3848, daikin: 4076, samsung: 3850 } },
    tri_9_9_9:    { label: "Tri-split 9 000 × 3 BTU",              p: { hisense: 2774, atlantic: 3023, lg: 3073, mitsubishi: 3490, daikin: 3796, samsung: 3500 } },
    tri_9_9_12:   { label: "Tri-split 9 000 + 9 000 + 12 000 BTU", p: { hisense: 2900, atlantic: 3200, lg: 3250, mitsubishi: 3640, daikin: 3990, samsung: 3680 } },
    tri_9_12_12:  { label: "Tri-split 9 000 + 12 000 + 12 000 BTU", p: { hisense: 3026, atlantic: 3377, lg: 3427, mitsubishi: 3790, daikin: 4184, samsung: 3820 } },
    tri_12_12_12: { label: "Tri-split 12 000 × 3 BTU",            p: { hisense: 3152, atlantic: 3554, lg: 3604, mitsubishi: 3940, daikin: 4378, samsung: 3980 } },
    monobloc_eau: { label: "Monobloc à eau 3 kW (Airwell)",        p: { hisense: 3000, atlantic: 3000, lg: 3000, mitsubishi: 3000, daikin: 3000, samsung: 3000 } },
  },
  annex: {
    liaison_base:    { label: "Liaison frigorifique (base)",        v: 60 },
    liaison_m:       { label: "Liaison frigorifique (€/mètre)",     v: 6.3 },
    goulotte_m:      { label: "Goulotte (€/mètre)",                 v: 5 },
    goulotte_min:    { label: "Goulotte (minimum)",                 v: 45 },
    // Câble de communication (bus entre le groupe extérieur et chaque unité intérieure) : longueur
    // = celle des liaisons frigorifiques. Généré d'office dans le devis (§ buildLines).
    cable_com_m:     { label: "Câble de communication (€/mètre)",   v: 2.5 },
    // Complément de fluide frigorigène : la précharge d'usine couvre `fluide_precharge_m` mètres de
    // liaison ; au-delà, on facture `fluide_m` par mètre supplémentaire. Généré d'office.
    fluide_precharge_m: { label: "Fluide : longueur pré-chargée incluse (m)", v: 10 },
    fluide_m:        { label: "Complément fluide frigorigène (€/mètre au-delà)", v: 8 },
    pompe:           { label: "Pompe de relevage (l'unité)",        v: 155 },
    support_sol:     { label: "Support extérieur au sol",           v: 59 },
    support_facade:  { label: "Support extérieur façade",           v: 75 },
    support_balcon:  { label: "Support extérieur balcon",           v: 75 },
    support_toiture: { label: "Support extérieur toiture / hauteur", v: 150 },
    percage_placo:   { label: "Perçage mur placo (l'unité)",        v: 40 },
    percage_brique:  { label: "Perçage mur brique (l'unité)",       v: 80 },
    percage_beton:   { label: "Perçage mur béton (l'unité)",        v: 150 },
    percage_pierre:  { label: "Perçage mur pierre (l'unité)",       v: 200 },
    electricite:     { label: "Électricité (disjoncteur + câbles)", v: 350 },
    compteur:        { label: "Évolution compteur / tableau",       v: 0 },
    depose:          { label: "Dépose ancien matériel",             v: 272.73 },
  },
  forfaits: {
    // Grille entretien (HT). La base couvre 1 groupe EXTÉRIEUR + 1 unité INTÉRIEURE ; au-delà,
    // +50 par unité intérieure et +100 par groupe extérieur (plus de travail dehors). Majoration
    // si l'installation n'a pas été entretenue depuis plus de 3 ans.
    entretien_premiere_contrat: { label: "Entretien, 1re unité (avec contrat annuel)",   v: 200 },
    entretien_premiere_sans:    { label: "Entretien ponctuel, 1re unité (sans contrat)", v: 250 },
    entretien_unite_supp:       { label: "Entretien, unité INTÉRIEURE supplémentaire",   v: 50 },
    entretien_exterieure_supp:  { label: "Entretien, groupe EXTÉRIEUR supplémentaire",   v: 100 },
    entretien_majoration_3ans:  { label: "Majoration : non entretenu depuis + de 3 ans", v: 100 },
    entretien_deplacement:      { label: "Déplacement entretien",                        v: 0 },
    depannage_diagnostic:       { label: "Diagnostic / déplacement",                     v: 90 },
    depose_unite:               { label: "Dépose (par unité)",                           v: 150 },
    depose_fluides:             { label: "Évacuation / recyclage des fluides",           v: 80 },
  },
  moRate: 150,
  marginCoeff: 1.265,
};

/** Catalogue courant : R2 si présent (fusionné avec les défauts pour les nouvelles clés), sinon défauts. */
export async function getCatalogue(): Promise<Catalogue> {
  const stored = (await r2GetJSON(CATALOGUE_KEY)) as Partial<Catalogue> | null;
  if (!stored) return DEFAULT_CATALOGUE;
  // Union des marques : celles enregistrées + toute marque par défaut absente (ex. ajout Samsung
  // alors qu'un catalogue perso existait déjà). On garde l'ordre enregistré puis on ajoute le reste.
  const storedBrands = stored.brands ?? DEFAULT_CATALOGUE.brands;
  const brands = [...storedBrands];
  for (const b of DEFAULT_CATALOGUE.brands) if (!brands.some((x) => x.id === b.id)) brands.push(b);
  // Équipements : défauts + surcharges enregistrées, en garantissant un prix pour CHAQUE marque
  // (backfill depuis le défaut, pour que les nouvelles marques ne soient pas à 0).
  const equip: Record<string, EquipItem> = {};
  for (const key of new Set([...Object.keys(DEFAULT_CATALOGUE.equip), ...Object.keys(stored.equip ?? {})])) {
    const def = DEFAULT_CATALOGUE.equip[key];
    const ov = (stored.equip ?? {})[key];
    equip[key] = ov ? { label: ov.label ?? def?.label ?? key, p: { ...(def?.p ?? {}), ...ov.p } } : def;
  }
  // Forfaits : défauts + surcharges, en retirant les clés OBSOLÈTES de l'ancienne grille entretien
  // (remplacée en juillet 2026 par 1re unité / unité supp / majoration 3 ans) qui pourraient
  // subsister dans un catalogue enregistré et polluer l'éditeur de prix.
  const forfaits = { ...DEFAULT_CATALOGUE.forfaits, ...(stored.forfaits ?? {}) };
  delete forfaits.entretien_unite;
  delete forfaits.entretien_contrat_unite;
  return {
    brands,
    equip,
    annex: { ...DEFAULT_CATALOGUE.annex, ...(stored.annex ?? {}) },
    forfaits,
    moRate: typeof stored.moRate === "number" ? stored.moRate : DEFAULT_CATALOGUE.moRate,
    marginCoeff: typeof stored.marginCoeff === "number" ? stored.marginCoeff : DEFAULT_CATALOGUE.marginCoeff,
    updatedAt: stored.updatedAt,
  };
}

export async function saveCatalogue(c: Catalogue): Promise<void> {
  await r2PutJSON(CATALOGUE_KEY, { ...c, updatedAt: new Date().toISOString() });
}

export type ChiffrageClient = { nom: string; tel: string; email: string; adr: string; cp: string; ville: string; entreprise: string; siren: string };

// Pré-remplissage de l'outil de chiffrage depuis un prospect (client + qualification).
export type ChiffragePrefill = {
  leadId?: string; // prospect d'origine (si on chiffre depuis une fiche)
  clientId?: string | null; // client existant rattaché (devis depuis « Nouveau devis ») → pas de doublon
  client: ChiffrageClient;
  clientType: "particulier" | "pro";
  prestation: Prestation;
  nbRooms: number;
  nbExterieures?: number; // groupes extérieurs (entretien), capté par Alex
  immeuble: boolean;
  depose: boolean;
  plus3ans?: boolean; // entretien : dernier entretien il y a plus de 3 ans (majoration pré-cochée)
};

// État complet sauvegardé en brouillon (restauré tel quel par l'outil). Types souples : l'outil
// connaît la forme exacte de rooms/install/lines et fait le cast.
export type ChiffrageDraft = {
  leadId?: string;
  clientId?: string | null;
  clientType: "particulier" | "pro";
  plus2ans: boolean;
  client: ChiffrageClient;
  prestation?: Prestation;
  prestaUnits?: number;
  prestaUnitsExt?: number; // groupes EXTÉRIEURS (entretien) : +100 € par groupe supplémentaire
  prestaHours?: number;
  prestaContrat?: boolean;
  prestaPlus3ans?: boolean; // dernier entretien il y a plus de 3 ans (ou jamais) -> majoration
  prestaNote?: string;
  rooms: unknown[];
  install: unknown;
  brand: string;
  lines?: unknown[];
  generated?: boolean;
  savedAt?: string;
};
