// Tarification des entretiens de climatisation. Source de vérité unique (site public,
// emails, souscription, back-office, PDF contrat/CERFA, chiffrage, Alex).
//
// GRILLE (décision du gérant, 14/07/2026) — identique aux particuliers et aux entreprises :
//   base            : 200 € avec contrat annuel / 250 € en visite ponctuelle.
//                     La base couvre 1 groupe EXTÉRIEUR + 1 unité INTÉRIEURE.
//   + 50 € par unité INTÉRIEURE supplémentaire
//   + 100 € par groupe EXTÉRIEUR supplémentaire (il y a plus de travail à l'extérieur)
//
// Seule la BASE DE PRIX change selon le client (voir alex-prompt, règle particulier/entreprise) :
//   - PARTICULIER : le nombre est du TTC (TVA 10 %).
//   - ENTREPRISE  : le MÊME nombre est du HT (TVA 20 %). Elle récupère la TVA, elle raisonne en HT.
//
// (Historique : le particulier était à +60 €/unité sans distinction intérieur/extérieur. Supprimé
//  le 14/07/2026 : un cas réel a montré qu'on facturait mal une installation à 2 groupes extérieurs,
//  le client n'ayant jamais été interrogé sur ce nombre.)

export type EntretienPrix = {
  htCt: number;    // hors taxes (centimes)
  tvaCt: number;   // montant de TVA (centimes)
  ttcCt: number;   // toutes taxes comprises (centimes)
  vatRate: number; // 10 (particulier) ou 20 (professionnel)
};

export const ENTRETIEN_BASE = { avecContrat: 200, sansContrat: 250 }; // couvre 1 ext + 1 int
export const ENTRETIEN_SUPPL_INTERIEURE = 50;  // € par unité intérieure supplémentaire
export const ENTRETIEN_SUPPL_EXTERIEURE = 100; // € par groupe extérieur supplémentaire

export type EntretienOpts = {
  withContract: boolean;
  pro?: boolean;
  /** Unités INTÉRIEURES (les appareils dans les pièces). Défaut 1. */
  units?: number;
  /** Groupes EXTÉRIEURS (les blocs posés dehors). Défaut 1. */
  unitsExterieures?: number;
};

/** Montant de référence (le nombre annoncé au client), avant application de la base HT/TTC. */
export function entretienMontant(opts: EntretienOpts): number {
  const int = Math.max(1, Math.floor(opts.units || 1));
  const ext = Math.max(1, Math.floor(opts.unitsExterieures || 1));
  const base = opts.withContract ? ENTRETIEN_BASE.avecContrat : ENTRETIEN_BASE.sansContrat;
  return base + (int - 1) * ENTRETIEN_SUPPL_INTERIEURE + (ext - 1) * ENTRETIEN_SUPPL_EXTERIEURE;
}

/** Prix d'un entretien. Le montant est le MÊME pour tous : seule sa base (HT ou TTC) change. */
export function entretienPrix(opts: EntretienOpts): EntretienPrix {
  const montant = entretienMontant(opts);
  if (opts.pro) {
    // Entreprise : le montant est du HORS TAXES, TVA 20 % en sus.
    const htCt = Math.round(montant * 100);
    const ttcCt = Math.round(montant * 1.2 * 100);
    return { htCt, ttcCt, tvaCt: ttcCt - htCt, vatRate: 20 };
  }
  // Particulier : le montant est du TTC, TVA 10 % incluse.
  const ttcCt = Math.round(montant * 100);
  const htCt = Math.round((montant / 1.1) * 100);
  return { htCt, ttcCt, tvaCt: ttcCt - htCt, vatRate: 10 };
}

/** Montant à AFFICHER et sa base : une entreprise voit du HT, un particulier du TTC.
 *  Source unique pour la page de souscription, les notifications et les e-mails. */
export function entretienAffichage(opts: EntretienOpts): {
  montant: number;          // en euros, à afficher tel quel
  base: "HT" | "TTC";       // mention obligatoire à côté du montant
  ttc: number;              // TTC réel (pour information / contrôle)
} {
  const p = entretienPrix(opts);
  return opts.pro
    ? { montant: p.htCt / 100, base: "HT", ttc: p.ttcCt / 100 }
    : { montant: p.ttcCt / 100, base: "TTC", ttc: p.ttcCt / 100 };
}

/** Détail ligne à ligne (devis, contrat, explication au client). */
export function entretienDetail(opts: EntretienOpts): { label: string; qte: number; pu: number; total: number }[] {
  const int = Math.max(1, Math.floor(opts.units || 1));
  const ext = Math.max(1, Math.floor(opts.unitsExterieures || 1));
  const base = opts.withContract ? ENTRETIEN_BASE.avecContrat : ENTRETIEN_BASE.sansContrat;
  const out = [{
    label: opts.withContract
      ? "Entretien, base contrat annuel (1 groupe extérieur + 1 unité intérieure)"
      : "Entretien ponctuel, base (1 groupe extérieur + 1 unité intérieure)",
    qte: 1, pu: base, total: base,
  }];
  if (int > 1) out.push({ label: "Unité intérieure supplémentaire", qte: int - 1, pu: ENTRETIEN_SUPPL_INTERIEURE, total: (int - 1) * ENTRETIEN_SUPPL_INTERIEURE });
  if (ext > 1) out.push({ label: "Groupe extérieur supplémentaire", qte: ext - 1, pu: ENTRETIEN_SUPPL_EXTERIEURE, total: (ext - 1) * ENTRETIEN_SUPPL_EXTERIEURE });
  return out;
}

// ── Compat : le « contrat de maintenance » = entretien AVEC contrat. Ces helpers restent
// utilisés là où le type de client n'est pas connu (référence particulier TTC). ──
export function contratTotalEuros(units: number, unitsExterieures = 1): number {
  return entretienPrix({ withContract: true, units, unitsExterieures }).ttcCt / 100;
}

export function contratTotalCt(units: number, unitsExterieures = 1): number {
  return entretienPrix({ withContract: true, units, unitsExterieures }).ttcCt;
}
