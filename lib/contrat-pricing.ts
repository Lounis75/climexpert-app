// Tarification des entretiens de climatisation. Source de vérité unique (site public,
// emails, souscription, back-office, PDF contrat/CERFA).
//
// Le prix dépend de DEUX choses :
//  1) Le client a-t-il un contrat de maintenance ? (avec = tarif réduit, sans = plein tarif)
//  2) Le type de client, qui fixe la TVA (10 % particulier, 20 % professionnel).
//
// Convention demandée par le gérant :
//  - Particulier : on cale le TTC sur un nombre rond (200 / 250 €), +60 € TTC/unité en plus.
//  - Professionnel : on cale le HT sur un nombre rond (182 / 228 €), +55 € HT/unité, TVA 20 %.

export type EntretienPrix = {
  htCt: number;    // hors taxes (centimes)
  tvaCt: number;   // montant de TVA (centimes)
  ttcCt: number;   // toutes taxes comprises (centimes)
  vatRate: number; // 10 ou 20
};

// Particulier (TVA 10 %), calé sur le TTC.
const TTC_PARTICULIER = { avecContrat: 200, sansContrat: 250 };
const SUPPL_TTC_PARTICULIER = 60; // € TTC par unité supplémentaire

// Professionnel (TVA 20 %), calé sur le HT (arrondi).
const HT_PRO = { avecContrat: 182, sansContrat: 228 };
const SUPPL_HT_PRO = 55; // € HT par unité supplémentaire (~ 60 € TTC particulier / 1,10)

/** Prix d'un entretien selon contrat / type de client / nombre d'unités. */
export function entretienPrix(opts: { withContract: boolean; pro?: boolean; units?: number }): EntretienPrix {
  const u = Math.max(1, Math.floor(opts.units || 1));
  if (opts.pro) {
    const ht = (opts.withContract ? HT_PRO.avecContrat : HT_PRO.sansContrat) + (u - 1) * SUPPL_HT_PRO;
    const htCt = Math.round(ht * 100);
    const ttcCt = Math.round(ht * 1.2 * 100);
    return { htCt, ttcCt, tvaCt: ttcCt - htCt, vatRate: 20 };
  }
  const ttc = (opts.withContract ? TTC_PARTICULIER.avecContrat : TTC_PARTICULIER.sansContrat) + (u - 1) * SUPPL_TTC_PARTICULIER;
  const ttcCt = Math.round(ttc * 100);
  const htCt = Math.round((ttc / 1.1) * 100);
  return { htCt, ttcCt, tvaCt: ttcCt - htCt, vatRate: 10 };
}

// ── Compat : le « contrat de maintenance » = entretien AVEC contrat. Ces helpers restent
// utilisés là où le type de client n'est pas connu (référence particulier TTC). ──
export function contratTotalEuros(units: number): number {
  return entretienPrix({ withContract: true, units }).ttcCt / 100;
}

export function contratTotalCt(units: number): number {
  return entretienPrix({ withContract: true, units }).ttcCt;
}
