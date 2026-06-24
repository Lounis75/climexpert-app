// Motifs de refus préfaits : choix en 1 clic, sans rien écrire (saisie libre optionnelle).
// Client-safe (pas d'import DB) -> utilisable côté page publique ET côté serveur.
export const DEVIS_MOTIFS_REFUS = [
  "Le prix est trop élevé",
  "J'ai choisi un autre artisan",
  "Je reporte mon projet",
  "Projet annulé",
  "Je veux encore réfléchir",
  "Autre raison",
] as const;

export type DevisMotifRefus = (typeof DEVIS_MOTIFS_REFUS)[number];
