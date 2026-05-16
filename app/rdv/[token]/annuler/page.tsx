"use client";
import { use, useState } from "react";
import { Wind, Phone, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function AnnulerPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [motif, setMotif] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/rdv/${token}/annuler`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motif }),
      });
      const d = await res.json();
      if (!res.ok) {
        const msgs: Record<string, string> = {
          token_invalide: "Ce lien ne correspond à aucune demande.",
          annulee: "Ce rendez-vous a déjà été annulé.",
          deja_confirme: "Ce lien d'annulation n'est plus valide.",
        };
        setError(msgs[d.error] ?? "Une erreur est survenue.");
        return;
      }
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
            <Wind className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm">Clim<span className="text-sky-500">Expert</span></span>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 py-8">
        {done ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-slate-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Annulation confirmée</h1>
            <p className="text-slate-500 text-sm">
              Votre rendez-vous a été annulé. Notre équipe va vous proposer un nouveau créneau prochainement.
            </p>
            <a href="tel:+33XXXXXXXXX" className="flex items-center justify-center gap-2 text-sky-500 font-semibold text-sm">
              <Phone className="w-4 h-4" /> Nous appeler directement
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <h1 className="text-xl font-bold text-slate-900">Annuler mon rendez-vous</h1>
            <p className="text-slate-500 text-sm">
              Vous êtes sur le point d'annuler votre intervention Clim Expert. Notre équipe vous recontactera pour convenir d'un nouveau créneau.
            </p>
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <label className="text-sm text-slate-600 block mb-2">Motif (optionnel)</label>
              <textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                rows={3}
                placeholder="Ex: Indisponible ce jour, problème résolu…"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            {error && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-xl">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors"
            >
              {submitting ? "Annulation…" : "Confirmer l'annulation"}
            </button>
            <Link href={`/rdv/${token}`} className="block text-center text-slate-400 text-sm hover:text-slate-600">
              ← Revenir au choix du créneau
            </Link>
          </form>
        )}
      </main>
    </div>
  );
}
