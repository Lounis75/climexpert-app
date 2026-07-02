// Pure functions with no external dependencies, safe for unit tests

export const DUREE_DEPLACEMENT: Record<string, number> = {
  "75": 30,
  "92": 45, "93": 45, "94": 45,
  "77": 60, "78": 60, "91": 60, "95": 60,
};

export function getDuреeDeplacement(codePostal: string): number {
  const dep = codePostal.substring(0, 2);
  return DUREE_DEPLACEMENT[dep] ?? 45;
}

export function calculerDureeTotale(codePostal: string, dureeInterventionMinutes: number): number {
  return dureeInterventionMinutes + getDuреeDeplacement(codePostal);
}

export const CAPACITE_JOURNALIERE = 480; // 8h

export interface Creneau {
  technicienId: string;
  technicienName: string;
  debut: Date;
  fin: Date;
  label: string;
}

export function isJourOuvre(date: Date): boolean {
  const jour = date.getDay();
  return jour >= 1 && jour <= 5;
}

// Instant UTC correspondant à `hour` h (heure de PARIS) le jour civil UTC de `day`.
// Indispensable sur Vercel (serveur en UTC) : setHours(9) y produirait 9h UTC, soit 10h/11h
// à Paris, donc des créneaux proposés au client décalés de 1 à 2 heures.
export function parisHour(day: Date, hour: number): Date {
  const utcGuess = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), hour, 0, 0, 0);
  // Décalage Paris/UTC à cette date (60 min l'hiver, 120 l'été), déduit du rendu localisé.
  const asParis = new Date(new Date(utcGuess).toLocaleString("en-US", { timeZone: "Europe/Paris" }));
  const asUTC = new Date(new Date(utcGuess).toLocaleString("en-US", { timeZone: "UTC" }));
  const offsetMin = Math.round((asParis.getTime() - asUTC.getTime()) / 60000);
  return new Date(utcGuess - offsetMin * 60000);
}

export function formatCreneau(debut: Date, fin: Date): string {
  const opts: Intl.DateTimeFormatOptions = { timeZone: "Europe/Paris", weekday: "long", day: "numeric", month: "long" };
  const dateStr = debut.toLocaleDateString("fr-FR", opts);
  const hDebut = debut.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
  const hFin = fin.toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
  return `${dateStr.charAt(0).toUpperCase() + dateStr.slice(1)}, ${hDebut} – ${hFin}`;
}

export function getWeekKey(d: Date): string {
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return monday.toISOString().split("T")[0];
}
