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

export function trackEvent(type: string, meta?: Record<string, unknown>) {
  try {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, path: location.pathname, sessionId: getSessionId(), meta }),
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
    trackEvent("page_view");
  }, [pathname]);
  return null;
}
