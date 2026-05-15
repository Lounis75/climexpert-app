"use client";

import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";

export default function SendEmailButton({ devisId, clientEmail }: { devisId: string; clientEmail: string | null }) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");

  if (!clientEmail) return null;

  async function send() {
    if (state !== "idle") return;
    setState("loading");
    try {
      const res = await fetch(`/api/admin/devis/${devisId}/send-email`, { method: "POST" });
      setState(res.ok ? "done" : "error");
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
        <><Check className="w-3.5 h-3.5" /> Envoyé</>
      ) : state === "error" ? (
        <>Erreur — réessayer</>
      ) : (
        <><Mail className="w-3.5 h-3.5" /> Envoyer par email</>
      )}
    </button>
  );
}
