"use client";
import { useState } from "react";
import SignaturePad from "@/components/SignaturePad";
import { FileText, PenLine, CheckCircle2 } from "lucide-react";

export default function SignAttestationClient({
  token, alreadySigned, clientName,
}: {
  token: string; alreadySigned: boolean; clientName: string;
}) {
  const [signature, setSignature] = useState<string | null>(null);
  const [accepte, setAccepte] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(alreadySigned);
  const [error, setError] = useState("");

  async function submit() {
    if (!signature) { setError("Merci de signer dans le cadre ci-dessus."); return; }
    if (!accepte) { setError("Merci de cocher « Lu et approuvé »."); return; }
    setSubmitting(true); setError("");
    try {
      const res = await fetch(`/api/attestation/${token}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
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
          <h1 className="text-xl font-bold text-slate-900 mb-2">Attestation signée, merci !</h1>
          <p className="text-slate-600 text-sm">Votre attestation d&apos;entretien signée vous a été envoyée par e-mail. Conservez-la : elle atteste de l&apos;entretien réglementaire de votre installation.</p>
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
          <h1 className="text-lg font-bold text-slate-900 mb-1">Signature de votre attestation d&apos;entretien</h1>
          <p className="text-slate-500 text-sm mb-4">Bonjour {clientName}, notre technicien est intervenu sur votre installation. Vérifiez l&apos;attestation puis signez ci-dessous.</p>

          <a href={`/api/attestation/${token}`} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3 border border-sky-200 bg-sky-50 text-sky-700 rounded-xl text-sm font-semibold mb-5 hover:bg-sky-100 transition-colors">
            <FileText className="w-4 h-4" /> Lire mon attestation (PDF)
          </a>

          <p className="text-sm font-semibold text-slate-900 mb-1 flex items-center gap-1.5">
            <PenLine className="w-4 h-4 text-emerald-600" /> Votre signature
          </p>
          <p className="text-xs text-slate-500 mb-2">Signez au doigt ou à la souris dans le cadre.</p>
          <SignaturePad onChange={setSignature} />

          <label className="flex items-start gap-2 mt-4 text-sm text-slate-700 cursor-pointer">
            <input type="checkbox" checked={accepte} onChange={(e) => setAccepte(e.target.checked)} className="mt-0.5" />
            <span>Lu et approuvé. J&apos;atteste que l&apos;intervention a bien été réalisée sur mon installation.</span>
          </label>

          {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2 mt-3">{error}</p>}

          <button onClick={submit} disabled={submitting}
            className="w-full mt-4 py-3.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors">
            {submitting ? "Envoi…" : "Signer mon attestation"}
          </button>
          <p className="text-[11px] text-slate-400 text-center mt-3">Signature électronique horodatée. L&apos;attestation signée vous sera envoyée automatiquement.</p>
        </div>
      </div>
    </div>
  );
}
