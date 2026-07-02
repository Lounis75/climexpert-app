"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from "lucide-react";

type State = "idle" | "confirm_refus" | "loading" | "accepted" | "refused" | "error";

const MOTIFS = ["Le prix est trop élevé", "J'ai choisi un autre prestataire", "Le projet est reporté", "Autre"];

export default function DevisPublicActions({ token }: { token: string }) {
  const [state, setState] = useState<State>("idle");
  const [motif, setMotif] = useState("");

  async function respond(action: "accepté" | "refusé") {
    setState("loading");
    try {
      const res = await fetch(`/api/devis/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, motif: action === "refusé" ? motif : undefined }),
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
        Une erreur est survenue. Veuillez réessayer ou nous appeler au{" "}
        <a href="tel:+33667432767" className="font-semibold underline">06 67 43 27 67</a>.
      </div>
    );
  }

  // Étape de confirmation du refus : un refus est définitif, il ne doit jamais partir sur un
  // tap accidentel. On en profite pour recueillir le motif (précieux commercialement).
  if (state === "confirm_refus") {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
        <h2 className="text-slate-900 font-semibold mb-1">Confirmer le refus ?</h2>
        <p className="text-slate-500 text-sm mb-4">
          Pour nous aider à nous améliorer, dites-nous en un mot pourquoi (facultatif) :
        </p>
        <div className="flex flex-wrap gap-2 mb-5">
          {MOTIFS.map((m) => (
            <button
              key={m}
              onClick={() => setMotif(m === motif ? "" : m)}
              className={`text-sm px-3.5 py-2 rounded-full border transition-colors ${motif === m ? "bg-slate-800 border-slate-800 text-white" : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"}`}
            >
              {m}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => respond("refusé")}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-red-500 hover:bg-red-400 text-white font-semibold rounded-xl transition-colors text-sm"
          >
            <XCircle className="w-4 h-4" />
            Je confirme le refus
          </button>
          <button
            onClick={() => { setState("idle"); setMotif(""); }}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded-xl transition-colors text-sm border border-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
            Revenir en arrière
          </button>
        </div>
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
          onClick={() => setState("confirm_refus")}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded-xl transition-colors text-sm border border-slate-200"
        >
          <XCircle className="w-4 h-4" />
          Refuser
        </button>
      </div>
    </div>
  );
}
