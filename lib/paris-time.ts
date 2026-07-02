// Helpers de dates en HEURE DE PARIS. Le serveur (Vercel) tourne en UTC : new Date()
// .toISOString().split("T")[0] ou toLocaleDateString() SANS timeZone y produisent le jour/l'heure
// UTC, décalés de 1 h (hiver) à 2 h (été) : un document signé à 00h30 heure de Paris porterait
// la date de la veille. Toujours passer par ces helpers côté serveur.

/** Jour civil à Paris au format ISO "YYYY-MM-DD" (ex. pour les colonnes date). */
export function todayParisISO(d: Date = new Date()): string {
  // fr-CA rend directement le format YYYY-MM-DD.
  return new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

/** Date courte française "JJ/MM/AAAA" en heure de Paris (documents, e-mails). */
export function formatDateShortParis(d: Date | string = new Date()): string {
  return new Date(d).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Date longue française ("mercredi 2 juillet 2026") en heure de Paris. */
export function formatDateLongParis(d: Date | string = new Date()): string {
  return new Date(d).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

/** Jour civil à Paris + n jours, au format ISO "YYYY-MM-DD". */
export function addDaysParisISO(n: number, from: Date = new Date()): string {
  const d = new Date(from);
  d.setDate(d.getDate() + n);
  return todayParisISO(d);
}
