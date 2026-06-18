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

/** Extrait l'IP cliente. On privilégie `x-real-ip` (posé par Vercel = vraie IP,
 *  non spoofable par le client), puis le DERNIER segment de x-forwarded-for
 *  (ajouté par le proxy de confiance) — pas le premier, qui est client-spoofable. */
export function clientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) return parts[parts.length - 1];
  }
  return "unknown";
}
