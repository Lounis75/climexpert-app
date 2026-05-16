// Pure functions with no external dependencies — safe for unit tests

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
