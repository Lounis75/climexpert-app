"use client";

import { useState } from "react";
import { Send, Check } from "lucide-react";

// Bouton "Envoyer l'accès au portail" sur la fiche client : envoie au client son lien d'espace.
export default function SendPortalAccess({ clientId, hasEmail }: { clientId: string; hasEmail: boolean }) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  async function send() {
    if (!hasEmail) { alert("Ce client n'a pas d'adresse e-mail. Ajoute-la d'abord."); return; }
    setState("sending");
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/send-portal`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { alert("⚠️ " + (d.error ?? "Échec de l'envoi")); setState("idle"); return; }
      setState("done");
      setTimeout(() => setState("idle"), 3000);
    } catch { alert("Erreur réseau, réessayez."); setState("idle"); }
  }

  return (
    <button
      onClick={send}
      disabled={state === "sending"}
      className="text-xs text-slate-400 hover:text-sky-400 underline underline-offset-2 disabled:opacity-50 inline-flex items-center gap-1 transition-colors"
    >
      {state === "done"
        ? <><Check className="w-3 h-3 text-emerald-400" /> Accès envoyé</>
        : state === "sending"
          ? "Envoi…"
          : <><Send className="w-3 h-3" /> Envoyer l&apos;accès</>}
    </button>
  );
}
