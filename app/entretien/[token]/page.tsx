"use client";
import { useState, use } from "react";
import { Wind, CheckCircle2, Shield, Wrench, Phone, Star } from "lucide-react";
import Link from "next/link";

const BENEFITS = [
  { icon: Wrench,       text: "Nettoyage complet filtres, évaporateur et condenseur" },
  { icon: Shield,       text: "Vérification fluide frigorigène et détection de fuites" },
  { icon: CheckCircle2, text: "Test des modes chaud et froid" },
  { icon: Star,         text: "Rapport d'intervention signé et garantie prolongée" },
];

export default function EntretienPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [units, setUnits] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const price = 180 + (units - 1) * 60;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/entretien/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setDone(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Demande enregistrée !</h1>
          <p className="text-slate-500 text-sm mb-6">
            Notre équipe vous contacte sous 48h pour planifier votre premier entretien.
          </p>
          <Link href={`/suivi/${token}`} className="text-sky-500 text-sm font-medium">
            ← Retour à mon espace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
              <Wind className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Clim<span className="text-sky-500">Expert</span></span>
          </div>
          <Link href={`/suivi/${token}`} className="text-xs text-slate-500 hover:text-slate-700">← Mon espace</Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl p-6 text-white text-center">
          <h1 className="text-2xl font-bold mb-2">Contrat d'entretien annuel</h1>
          <p className="text-sky-100 text-sm">Préservez votre équipement et votre garantie avec un entretien professionnel chaque année.</p>
        </div>

        {/* Avantages */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5 space-y-3">
          <p className="text-sm font-bold text-slate-900">Ce qui est inclus</p>
          {BENEFITS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-8 h-8 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-sky-500" />
              </div>
              <p className="text-sm text-slate-700">{text}</p>
            </div>
          ))}
        </div>

        {/* Tarif */}
        <div className="bg-white border border-slate-100 rounded-3xl p-5">
          <p className="text-sm font-bold text-slate-900 mb-1">Tarif</p>
          <p className="text-slate-500 text-xs mb-4">180 € TTC (1re unité) + 60 € TTC par unité supplémentaire · Paris intramuros</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-slate-500 block mb-2">Nombre d'unités intérieures</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUnits((u) => Math.max(1, u - 1))}
                  className="w-10 h-10 rounded-xl border border-slate-200 text-slate-600 font-bold text-lg flex items-center justify-center hover:bg-slate-50"
                >
                  −
                </button>
                <span className="w-10 text-center font-bold text-slate-900 text-lg">{units}</span>
                <button
                  type="button"
                  onClick={() => setUnits((u) => Math.min(10, u + 1))}
                  className="w-10 h-10 rounded-xl border border-slate-200 text-slate-600 font-bold text-lg flex items-center justify-center hover:bg-slate-50"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between">
              <span className="text-sm text-slate-600">Total annuel</span>
              <span className="text-2xl font-bold text-slate-900">{price} €<span className="text-sm font-semibold ml-1 opacity-50">TTC</span></span>
            </div>

            {error && <p className="text-red-500 text-xs bg-red-50 p-3 rounded-xl">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-bold rounded-2xl transition-colors"
            >
              {submitting ? "Envoi…" : "Souscrire au contrat"}
            </button>
          </form>

          <p className="text-[10px] text-slate-400 text-center mt-3">
            Sans engagement — résiliable à tout moment. Notre équipe vous contacte pour valider les modalités.
          </p>
        </div>

        {/* Contact */}
        <div className="text-center">
          <p className="text-slate-500 text-xs mb-2">Des questions ? Appelez-nous</p>
          <a href="tel:+33XXXXXXXXX" className="flex items-center justify-center gap-2 text-sky-500 font-semibold text-sm">
            <Phone className="w-4 h-4" /> Nous appeler
          </a>
        </div>
      </main>
    </div>
  );
}
