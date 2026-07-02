"use client";

import { useState } from "react";
import { CheckCircle2, CalendarClock, AlertTriangle, Send } from "lucide-react";

const RAISONS = ["Je souhaite une autre date", "J'ai un empêchement", "J'ai changé d'avis", "Autre"];

export default function RdvConfirmClient({ token, already, preAction }: { token: string; already: string | null; preAction: string | null }) {
  const [status, setStatus] = useState<"idle" | "confirmed" | "problem_sent">(
    already === "confirme" ? "confirmed" : already === "probleme" ? "problem_sent" : "idle",
  );
  const [showProblem, setShowProblem] = useState(preAction === "probleme");
  const [raison, setRaison] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function send(action: "confirme" | "probleme", msg?: string) {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/rdv-confirmation/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, message: msg }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? "Une erreur est survenue, réessayez."); return; }
      setStatus(action === "confirme" ? "confirmed" : "problem_sent");
    } catch { setError("Erreur réseau, réessayez."); }
    finally { setBusy(false); }
  }

  if (status === "confirmed") {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><CheckCircle2 className="w-9 h-9 text-emerald-600" /></div>
        <h2 className="text-xl font-bold text-slate-900">Rendez-vous confirmé, merci !</h2>
        <p className="text-slate-500 mt-2">Votre rendez-vous est bien confirmé. Notre technicien sera présent au créneau prévu. À très bientôt !</p>
      </div>
    );
  }
  if (status === "problem_sent") {
    return (
      <div className="text-center py-4">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4"><CalendarClock className="w-9 h-9 text-amber-600" /></div>
        <h2 className="text-xl font-bold text-slate-900">C&apos;est noté, merci !</h2>
        <p className="text-slate-500 mt-2">Nous avons bien reçu votre message. Notre équipe vous recontacte très rapidement pour trouver une solution.</p>
      </div>
    );
  }

  return (
    <div>
      {!showProblem ? (
        <div className="space-y-3">
          <button onClick={() => send("confirme")} disabled={busy} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold transition-colors">
            <CheckCircle2 className="w-5 h-5" /> {busy ? "…" : "Je confirme mon rendez-vous"}
          </button>
          <button onClick={() => setShowProblem(true)} disabled={busy} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white border border-slate-300 hover:border-amber-400 text-slate-700 font-semibold transition-colors">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> Oups, j&apos;ai un problème
          </button>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-slate-700">Quel est le souci ?</p>
          <div className="flex flex-wrap gap-2">
            {RAISONS.map((r) => (
              <button key={r} onClick={() => setRaison(r)} className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${raison === r ? "bg-sky-500 border-sky-500 text-white" : "bg-white border-slate-300 text-slate-600 hover:border-sky-400"}`}>{r}</button>
            ))}
          </div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Un mot pour nous aider (facultatif) : vos disponibilités, la raison…" className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-sky-400 resize-none" />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => send("probleme", [raison, message.trim()].filter(Boolean).join(" : "))}
              disabled={busy || (!raison && !message.trim())}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold transition-colors">
              <Send className="w-4 h-4" /> {busy ? "Envoi…" : "Envoyer"}
            </button>
            <button onClick={() => setShowProblem(false)} disabled={busy} className="px-4 py-3 text-slate-500 hover:text-slate-700 text-sm">Retour</button>
          </div>
        </div>
      )}
    </div>
  );
}
