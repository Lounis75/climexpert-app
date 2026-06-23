"use client";
import { useState } from "react";
import SignaturePad from "@/components/SignaturePad";
import { FileText, PenLine, CheckCircle2 } from "lucide-react";

export default function SignContratClient({
  token, alreadySigned, clientName, numero, prixAn, units,
}: {
  token: string; alreadySigned: boolean; clientName: string; numero: string; prixAn: number; units: number;
}) {
  const [signature, setSignature] = useState<string | null>(null);
  const [accepte, setAccepte]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]           = useState(alreadySigned);
  const [error, setError]         = useState("");

  async function submit() {
    if (!signature) { setError("Merci de signer dans le cadre ci-dessus."); return; }
    if (!accepte)   { setError("Merci de cocher « Lu et approuvé, bon pour accord »."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch("/api/contrat-signature", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, signature }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? "Une erreur est survenue."); setSubmitting(false); return; }
      setDone(true);
    } catch { setError("Erreur réseau, réessayez."); setSubmitting(false); }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md text-center shadow-sm">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Contrat signé, merci !</h1>
          <p className="text-slate-600 text-sm">Votre contrat d&apos;entretien signé vous a été envoyé par e-mail et déposé sur votre espace client. À très bientôt.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-lg mx-auto space-y-5">
        <div className="text-center">
          <span className="font-bold text-slate-900 text-lg">Clim<span className="text-sky-500">Expert</span></span>
        </div>
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900 mb-1">Signature de votre contrat d&apos;entretien</h1>
          <p className="text-slate-500 text-sm mb-4">Bonjour {clientName}, vérifiez votre contrat puis signez ci-dessous.</p>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-sm text-slate-700 space-y-1 mb-4">
            {numero && <p><span className="text-slate-400">Contrat n° </span>{numero}</p>}
            <p><span className="text-slate-400">Formule&nbsp;: </span>{units} unité{units > 1 ? "s" : ""} · {prixAn.toLocaleString("fr-FR")} € TTC/an</p>
          </div>

          <a href={`/api/contrat-signature?token=${token}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 border border-sky-200 bg-sky-50 text-sky-700 rounded-xl text-sm font-semibold mb-5 hover:bg-sky-100 transition-colors">
            <FileText className="w-4 h-4" /> Lire le contrat complet (PDF)
          </a>

          <p className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
            <PenLine className="w-4 h-4 text-emerald-600" /> Votre signature
          </p>
          <p className="text-xs text-slate-500 mb-2">Signez au doigt ou à la souris dans le cadre.</p>
          <SignaturePad onChange={setSignature} />

          <label className="flex items-start gap-2 mt-4 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={accepte} onChange={(e) => setAccepte(e.target.checked)} className="mt-0.5" />
            <span>Lu et approuvé, bon pour accord. J&apos;accepte les conditions du contrat d&apos;entretien.</span>
          </label>

          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2 mt-3">{error}</p>}

          <button onClick={submit} disabled={submitting}
            className="w-full mt-4 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors">
            {submitting ? "Envoi…" : "Signer le contrat"}
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-3">Signature électronique horodatée. Le contrat signé vous sera envoyé automatiquement.</p>
        </div>
      </div>
    </div>
  );
}
