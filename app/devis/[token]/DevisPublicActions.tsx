"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

type State = "idle" | "loading" | "accepted" | "refused" | "error";

export default function DevisPublicActions({ token }: { token: string }) {
  const [state, setState] = useState<State>("idle");

  async function respond(action: "accepté" | "refusé") {
    setState("loading");
    try {
      const res = await fetch(`/api/devis/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setState(action === "accepté" ? "accepted" : "refused");
        window.location.reload();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  if (state === "loading") {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center text-red-600 text-sm">
        Une erreur est survenue. Veuillez réessayer ou nous contacter directement.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
      <h2 className="text-slate-900 font-semibold mb-1">Votre décision</h2>
      <p className="text-slate-500 text-sm mb-6">
        En acceptant ce devis, vous confirmez votre accord sur la prestation et les tarifs indiqués. Aucun paiement n&apos;est demandé à ce stade.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => respond("accepté")}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          Accepter ce devis
        </button>
        <button
          onClick={() => respond("refusé")}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded-xl transition-colors text-sm border border-slate-200"
        >
          <XCircle className="w-4 h-4" />
          Refuser
        </button>
      </div>
    </div>
  );
}
