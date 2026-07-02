// Rate-limit par clé (généralement l'IP). Deux modes :
//  - Upstash Redis (REST) si UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN sont configurés :
//    quota PARTAGÉ entre toutes les instances serverless (protection réelle sous charge).
//  - Sinon, repli en mémoire par instance : suffisant pour freiner les boucles/abus rapides
//    d'une même IP sur une instance chaude, mais pas un quota distribué strict (chaque lambda
//    a sa propre Map et un cold start remet le compteur à zéro).
// En cas d'erreur Redis on retombe sur la mémoire : on ne bloque jamais un vrai client à
// cause d'un incident Upstash.

import { logError } from "@/lib/observability";

const buckets = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, max: number, windowMs: number): boolean {
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

/** Retourne true si la requête est autorisée, false si la limite est atteinte. */
export async function rateLimit(key: string, max: number, windowMs: number): Promise<boolean> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      // INCR + expiration posée uniquement à la création de la clé (NX), en un seul aller-retour.
      const res = await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify([["INCR", `rl:${key}`], ["PEXPIRE", `rl:${key}`, String(windowMs), "NX"]]),
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { result?: number | string }[];
        const count = Number(data?.[0]?.result ?? 0);
        if (count > 0) return count <= max;
      }
    } catch (e) {
      logError("rateLimit.redis", e, { key });
    }
  }
  return memoryLimit(key, max, windowMs);
}

/** Extrait l'IP cliente. On privilégie `x-real-ip` (posé par Vercel = vraie IP,
 *  non spoofable par le client), puis le DERNIER segment de x-forwarded-for
 *  (ajouté par le proxy de confiance), pas le premier, qui est client-spoofable. */
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
