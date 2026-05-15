"use client";

import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";

export default function SendEmailButton({ factureId }: { factureId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  async function send() {
    if (state !== "idle") return;
    setState("loading");
    try {
      const res = await fetch(`/api/admin/factures/${factureId}/send-email`, { method: "POST" });
      if (res.ok) {
        setState("done");
      } else {
        const d = await res.json();
        if (d.error === "Ce client n'a pas d'email") {
          alert("Ce client n'a pas d'email renseigné.");
        }
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <button
      onClick={send}
      disabled={state === "loading" || state === "done"}
      className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-xl transition-all disabled:opacity-60 ${
        state === "done"
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          : state === "error"
          ? "bg-red-500/10 border-red-500/30 text-red-400"
          : "bg-slate-700/60 border-white/10 text-slate-300 hover:text-white hover:border-white/20"
      }`}
    >
      {state === "loading" ? (
        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi…</>
      ) : state === "done" ? (
        <><Check className="w-3.5 h-3.5" /> Envoyée</>
      ) : state === "error" ? (
        <>Erreur — réessayer</>
      ) : (
        <><Mail className="w-3.5 h-3.5" /> Envoyer par email</>
      )}
    </button>
  );
}
