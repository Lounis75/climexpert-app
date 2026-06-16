// Rate-limit en mémoire, par instance serverless.
// ⚠️ Non partagé entre instances (chaque lambda a sa propre Map) : suffisant
// pour freiner les boucles/abus rapides d'une même IP sur une instance chaude,
// mais pas un quota distribué strict. Pour ça → Upstash Redis / Vercel KV.

const buckets = new Map<string, { count: number; resetAt: number }>();

/** Retourne true si la requête est autorisée, false si la limite est atteinte. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const rec = buckets.get(key);
  if (!rec || now > rec.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (rec.count >= max) return false;
  rec.count++;
  return true;
}

/** Extrait l'IP cliente d'une requête (header x-forwarded-for de Vercel). */
export function clientIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}
