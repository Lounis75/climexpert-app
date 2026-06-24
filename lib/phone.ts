// Normalisation / extraction de numéros de téléphone français. Client-safe (pas d'import DB).

/** Renvoie le numéro au format national "0XXXXXXXXX" (10 chiffres), ou null si invalide. */
export function normalizePhone(raw: string): string | null {
  let s = (raw || "").trim().replace(/[^\d+]/g, "");
  if (s.startsWith("+33")) s = "0" + s.slice(3);
  else if (s.startsWith("0033")) s = "0" + s.slice(4);
  s = s.replace(/\D/g, "");
  if (s.length === 9 && /^[1-9]/.test(s)) s = "0" + s; // "633179656" -> "0633179656"
  return /^0\d{9}$/.test(s) ? s : null;
}

/** "0633179656" -> "06 33 17 96 56" (pour l'affichage / le nom du prospect). */
export function formatPhone(n: string): string {
  return /^0\d{9}$/.test(n) ? n.replace(/(\d{2})(?=\d)/g, "$1 ").trim() : n;
}

/** Extrait tous les numéros FR valides et UNIQUES d'un texte libre (1/ligne, séparés, ou noyés). */
export function extractPhones(text: string): string[] {
  const matches = (text || "").match(/(?:\+33|0033|0)[\s.\-]?\d(?:[\s.\-]?\d){8}/g) ?? [];
  const set = new Set<string>();
  for (const m of matches) {
    const n = normalizePhone(m);
    if (n) set.add(n);
  }
  return [...set];
}
