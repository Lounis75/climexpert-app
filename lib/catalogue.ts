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
    { id: "daikin",     name: "Daikin",     pos: "Haut",         db: "~45-48 dB", lowNoise: true },
  ],
  equip: {
    mono_9000:    { label: "Mono-split mural 2,5 kW / 9 000 BTU",  p: { hisense: 582,  atlantic: 784,  lg: 784,  mitsubishi: 736,  daikin: 894 } },
    mono_12000:   { label: "Mono-split mural 3,5 kW / 12 000 BTU", p: { hisense: 708,  atlantic: 961,  lg: 961,  mitsubishi: 886,  daikin: 1088 } },
    mono_18000:   { label: "Mono-split mural 5 kW / 18 000 BTU",   p: { hisense: 961,  atlantic: 1240, lg: 1265, mitsubishi: 1240, daikin: 1379 } },
    mono_24000:   { label: "Mono-split mural 7 kW / 24 000 BTU",   p: { hisense: 1240, atlantic: 1645, lg: 1708, mitsubishi: 1898, daikin: 1834 } },
    bi_9_9:       { label: "Bi-split 9 000 + 9 000 BTU",           p: { hisense: 1550, atlantic: 1750, lg: 1750, mitsubishi: 1999, daikin: 2300 } },
    bi_9_12:      { label: "Bi-split 9 000 + 12 000 BTU",          p: { hisense: 2300, atlantic: 2600, lg: 2600, mitsubishi: 2990, daikin: 3300 } },
    tri_9_9_12:   { label: "Tri-split 9 000 + 9 000 + 12 000 BTU", p: { hisense: 2900, atlantic: 3200, lg: 3250, mitsubishi: 3640, daikin: 3990 } },
    monobloc_eau: { label: "Monobloc à eau 3 kW (Airwell)",        p: { hisense: 3000, atlantic: 3000, lg: 3000, mitsubishi: 3000, daikin: 3000 } },
  },
  annex: {
    liaison_base:    { label: "Liaison frigorifique (base)",        v: 60 },
    liaison_m:       { label: "Liaison frigorifique (€/mètre)",     v: 6.3 },
    goulotte_m:      { label: "Goulotte (€/mètre)",                 v: 5 },
    goulotte_min:    { label: "Goulotte (minimum)",                 v: 45 },
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
    entretien_unite:         { label: "Entretien (par unité)",              v: 90 },
    entretien_deplacement:   { label: "Déplacement entretien",              v: 0 },
    entretien_contrat_unite: { label: "Contrat annuel (par unité)",         v: 150 },
    depannage_diagnostic:    { label: "Diagnostic / déplacement",           v: 90 },
    depose_unite:            { label: "Dépose (par unité)",                 v: 150 },
    depose_fluides:          { label: "Évacuation / recyclage des fluides", v: 80 },
  },
  moRate: 150,
  marginCoeff: 1.265,
};

/** Catalogue courant : R2 si présent (fusionné avec les défauts pour les nouvelles clés), sinon défauts. */
export async function getCatalogue(): Promise<Catalogue> {
  const stored = (await r2GetJSON(CATALOGUE_KEY)) as Partial<Catalogue> | null;
  if (!stored) return DEFAULT_CATALOGUE;
  return {
    brands: stored.brands ?? DEFAULT_CATALOGUE.brands,
    equip: { ...DEFAULT_CATALOGUE.equip, ...(stored.equip ?? {}) },
    annex: { ...DEFAULT_CATALOGUE.annex, ...(stored.annex ?? {}) },
    forfaits: { ...DEFAULT_CATALOGUE.forfaits, ...(stored.forfaits ?? {}) },
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
  leadId: string;
  client: ChiffrageClient;
  clientType: "particulier" | "pro";
  prestation: Prestation;
  nbRooms: number;
  immeuble: boolean;
  depose: boolean;
};

// État complet sauvegardé en brouillon (restauré tel quel par l'outil). Types souples : l'outil
// connaît la forme exacte de rooms/install/lines et fait le cast.
export type ChiffrageDraft = {
  leadId?: string;
  clientType: "particulier" | "pro";
  plus2ans: boolean;
  client: ChiffrageClient;
  prestation?: Prestation;
  prestaUnits?: number;
  prestaHours?: number;
  prestaContrat?: boolean;
  prestaNote?: string;
  rooms: unknown[];
  install: unknown;
  brand: string;
  lines?: unknown[];
  generated?: boolean;
  savedAt?: string;
};
