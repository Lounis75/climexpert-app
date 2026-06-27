"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Identifiant visiteur anonyme (localStorage), pas de cookie, RGPD-friendly. */
function getSessionId(): string {
  try {
    let id = localStorage.getItem("cx_sid");
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("cx_sid", id);
    }
    return id;
  } catch {
    return "anon";
  }
}

export function trackEvent(type: string, meta?: Record<string, unknown>, ref?: string) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // `ref` = document.referrer (vraie source d'arrivée) ; le serveur le normalise (google,
      // réseaux sociaux…) ou le met à null pour une navigation interne / un accès direct.
      body: JSON.stringify({ type, path: location.pathname, sessionId: getSessionId(), meta, ref }),
      keepalive: true,
    }).catch(() => {});
  } catch { /* ignore */ }
}

/** Enregistre une visite (page_view) à chaque navigation sur le SITE PUBLIC. */
export default function Tracker() {
  const pathname = usePathname();
  useEffect(() => {
    if (!pathname) return;
    // On ne piste pas le back-office ni les écrans d'auth/API.
    if (/^\/(admin|technicien|commercial|connexion|activer|api)(\/|$)/.test(pathname)) return;
    // En App Router, document.referrer reste la source d'entrée du chargement courant
    // (l'origine externe Google/réseaux), pas la page interne précédente.
    trackEvent("page_view", undefined, typeof document !== "undefined" ? document.referrer : undefined);
  }, [pathname]);
  return null;
}
