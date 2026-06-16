// Tarification officielle d'un contrat d'entretien :
// 180 € TTC pour la 1ʳᵉ unité + 60 € TTC par unité supplémentaire.
// Source de vérité unique partagée par : page publique, email de confirmation,
// route de souscription client, formulaire admin et affichage back-office.
// NB : la colonne `contrats_entretien.prix_unitaire_ct` stocke ce TOTAL annuel
// (en centimes), pas un prix par unité.

export function contratTotalEuros(units: number): number {
  const u = Math.max(1, Math.floor(units || 1));
  return 180 + (u - 1) * 60;
}

export function contratTotalCt(units: number): number {
  return Math.round(contratTotalEuros(units) * 100);
}
