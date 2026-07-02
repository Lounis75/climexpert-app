"use client";

import { useState } from "react";
import { Phone, FileText, Check, X, ChevronLeft } from "lucide-react";
import { DEVIS_MOTIFS_REFUS } from "@/lib/devis-decision";

const COMPANY_PHONE = "06 67 43 27 67";

export default function DevisDecisionClient({
  token, clientName, devisUrl, montant, decision,
}: {
  token: string;
  clientName: string;
  devisUrl: string;
  montant: number | null;
  decision: string | null;
}) {
  const [view, setView] = useState<"idle" | "refus" | "done">(decision ? "done" : "idle");
  const [result, setResult] = useState<string | null>(decision);
  const [motif, setMotif] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function send(d: "accepte" | "refuse") {
    setLoading(true); setError("");
    try {
      const finalMotif = d === "refuse" ? [motif, comment.trim()].filter(Boolean).join(" : ") : undefined;
      const res = await fetch("/api/devis-decision", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, decision: d, motif: finalMotif }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Une erreur est survenue, réessayez."); return; }
      // Vérité serveur : si le devis avait déjà été tranché (rejeu réseau, autre onglet), on affiche
      // la décision réellement enregistrée en base, pas celle qu'on vient de cliquer.
      setResult(data.decision ?? d); setView("done");
    } catch { setError("Erreur réseau, réessayez."); }
    finally { setLoading(false); }
  }

  const tel = COMPANY_PHONE.replace(/\s/g, "");
  const fmtMontant = montant != null ? `${montant.toLocaleString("fr-FR")} €` : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-4 py-4">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center"><span className="text-white font-bold text-xs">C</span></div>
            <span className="font-bold text-slate-900 text-sm">ClimExpert</span>
          </div>
          <a href={`tel:${tel}`} className="text-xs text-slate-500 flex items-center gap-1.5 hover:text-sky-600 transition-colors"><Phone className="w-3.5 h-3.5" />{COMPANY_PHONE}</a>
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-10">
        {view === "done" ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            {result === "accepte" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="w-9 h-9 text-emerald-600" /></div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">Merci{clientName ? ` ${clientName}` : ""} !</h1>
                <p className="text-slate-600 text-sm">Votre devis est <strong>accepté</strong>. Notre équipe vous contacte très vite pour planifier l&apos;intervention.</p>
                <a href={`tel:${tel}`} className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors"><Phone className="w-4 h-4" /> Nous appeler</a>
              </>
            ) : result === "annule" ? (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4"><X className="w-9 h-9 text-amber-600" /></div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">Ce devis n&apos;est plus d&apos;actualité</h1>
                <p className="text-slate-600 text-sm">Ce devis a été annulé{clientName ? `, ${clientName}` : ""}. Si votre projet est toujours d&apos;actualité, contactez-nous pour un devis à jour.</p>
                <a href={`tel:${tel}`} className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-xl transition-colors"><Phone className="w-4 h-4" /> Nous appeler</a>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4"><X className="w-9 h-9 text-slate-500" /></div>
                <h1 className="text-xl font-bold text-slate-900 mb-2">C&apos;est noté, merci.</h1>
                <p className="text-slate-600 text-sm">Votre réponse a bien été enregistrée. Si votre projet évolue, nous restons à votre disposition.</p>
                <a href={`tel:${tel}`} className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-colors"><Phone className="w-4 h-4" /> Nous appeler</a>
              </>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
            <h1 className="text-xl font-bold text-slate-900">Bonjour{clientName ? ` ${clientName}` : ""},</h1>
            <p className="text-slate-600 text-sm mt-1.5">Voici votre devis. Prenez le temps de le consulter, puis donnez-nous votre réponse.</p>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide">Montant du devis</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{fmtMontant ?? "Voir le PDF"}</p>
              </div>
              <a href={devisUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-xl transition-colors whitespace-nowrap"><FileText className="w-4 h-4" /> Voir le devis</a>
            </div>

            {error && <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

            {view === "idle" ? (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button onClick={() => send("accepte")} disabled={loading} className="flex items-center justify-center gap-2 py-3.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors">
                  <Check className="w-5 h-5" /> J&apos;accepte ce devis
                </button>
                <button onClick={() => setView("refus")} disabled={loading} className="flex items-center justify-center gap-2 py-3.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors">
                  <X className="w-5 h-5" /> Décliner
                </button>
                <p className="sm:col-span-2 text-center text-xs text-slate-400">En cliquant sur « J&apos;accepte ce devis », vous donnez votre <strong className="text-slate-500">bon pour accord</strong> (vaut signature).</p>
              </div>
            ) : (
              <div className="mt-6">
                <button onClick={() => { setView("idle"); setMotif(""); setComment(""); }} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mb-3"><ChevronLeft className="w-3.5 h-3.5" /> Retour</button>
                <p className="text-sm font-semibold text-slate-800 mb-1">Pouvez-vous nous dire pourquoi ?</p>
                <p className="text-xs text-slate-400 mb-3">Choisissez simplement une raison, rien à écrire.</p>
                <div className="flex flex-wrap gap-2">
                  {DEVIS_MOTIFS_REFUS.map((m) => (
                    <button key={m} onClick={() => setMotif(m)} className={`px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${motif === m ? "bg-sky-500 border-sky-500 text-white" : "bg-white border-slate-300 text-slate-600 hover:border-slate-400"}`}>{m}</button>
                  ))}
                </div>
                {motif === "Autre raison" && (
                  <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Précisez (facultatif)…" className="mt-3 w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 text-sm focus:outline-none focus:border-sky-400 resize-none" />
                )}
                <button onClick={() => send("refuse")} disabled={loading || !motif} className="mt-4 w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-semibold rounded-xl transition-colors">
                  {loading ? "Envoi…" : "Envoyer ma réponse"}
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-slate-400 mt-6">CLIM EXPERT SAS &middot; contact@climexpert.fr</p>
      </main>
    </div>
  );
}
