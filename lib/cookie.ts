// Options communes des cookies de session.
//
// Le point clé : en production sur un hôte climexpert.fr, on pose `domain: ".climexpert.fr"`
// pour PARTAGER la session entre l'apex (climexpert.fr), www.climexpert.fr et les sous-domaines.
// Sans ça, le cookie est lié à un seul hôte : basculer d'un hôte à l'autre (fréquent sur
// mobile via liens / autocomplétion) fait perdre la session → reconnexions intempestives.
//
// On ne pose le `domain` que si l'hôte se termine par climexpert.fr → les déploiements de
// preview Vercel (*.vercel.app) gardent un cookie host-only fonctionnel.

const PROD = process.env.NODE_ENV === "production";

function useDomain(host?: string | null): boolean {
  if (!PROD || !host) return false;
  return host.replace(/:\d+$/, "").endsWith("climexpert.fr");
}

export function sessionCookieOptions(host?: string | null, maxAgeDays = 30) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: PROD,
    path: "/",
    maxAge: 60 * 60 * 24 * maxAgeDays,
    ...(useDomain(host) ? { domain: ".climexpert.fr" } : {}),
  };
}

export function clearCookieOptions(host?: string | null) {
  return { maxAge: 0, path: "/", ...(useDomain(host) ? { domain: ".climexpert.fr" } : {}) };
}
