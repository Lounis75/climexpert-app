"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Calculator, ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Client } from "@/lib/db/schema";

type Ligne = {
  designation: string;
  quantite: number;
  prixUnitaireEuros: number;
  tvaRate: string;
};

const TVA_RATES = ["5.5", "10", "20"];
const EMPTY_LIGNE: Ligne = { designation: "", quantite: 1, prixUnitaireEuros: 0, tvaRate: "10" };

function calcLigne(l: Ligne) {
  const ht = l.quantite * l.prixUnitaireEuros;
  const tva = ht * (Number(l.tvaRate) / 100);
  return { ht, tva, ttc: ht + tva };
}

function fmt(n: number) {
  return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export default function DevisForm({ clients }: { clients: Client[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [lignes, setLignes] = useState<Ligne[]>([{ ...EMPTY_LIGNE }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function updateLigne(i: number, patch: Partial<Ligne>) {
    setLignes((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  function addLigne() {
    setLignes((prev) => [...prev, { ...EMPTY_LIGNE }]);
  }

  function removeLigne(i: number) {
    setLignes((prev) => prev.filter((_, idx) => idx !== i));
  }

  const totals = lignes.reduce(
    (acc, l) => {
      const { ht, tva, ttc } = calcLigne(l);
      return { ht: acc.ht + ht, tva: acc.tva + tva, ttc: acc.ttc + ttc };
    },
    { ht: 0, tva: 0, ttc: 0 }
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!clientId) { setError("Sélectionnez un client"); return; }
    const emptyLine = lignes.find((l) => !l.designation.trim());
    if (emptyLine) { setError("Toutes les lignes doivent avoir une désignation"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, description, validUntil: validUntil || undefined, lignes }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erreur");
        return;
      }
      const { devis } = await res.json();
      router.push(`/admin/devis/${devis.id}`);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/devis" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Nouveau devis</h1>
      </div>

      {/* Infos générales */}
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-6 grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Client *</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
          >
            <option value="">Sélectionner un client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name} {c.city ? `— ${c.city}` : ""}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Valable jusqu&apos;au</label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Description / objet</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Ex : Installation climatiseur bi-split Daikin, appartement 75m²"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all resize-none"
          />
        </div>
      </div>

      {/* Lignes */}
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">Lignes du devis</h2>
          <button
            type="button"
            onClick={addLigne}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 text-xs font-medium rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Ajouter une ligne
          </button>
        </div>

        {/* Thead */}
        <div className="hidden sm:grid grid-cols-[2fr_80px_120px_80px_100px_32px] gap-3 px-5 py-2 text-xs text-slate-500 border-b border-white/5">
          <span>Désignation</span>
          <span>Qté</span>
          <span>P.U. HT (€)</span>
          <span>TVA</span>
          <span className="text-right">Total TTC</span>
          <span />
        </div>

        <div className="divide-y divide-white/5">
          {lignes.map((l, i) => {
            const { ttc } = calcLigne(l);
            return (
              <div key={i} className="grid sm:grid-cols-[2fr_80px_120px_80px_100px_32px] grid-cols-1 gap-3 px-5 py-3 items-center">
                <input
                  type="text"
                  value={l.designation}
                  onChange={(e) => updateLigne(i, { designation: e.target.value })}
                  placeholder="Désignation de la prestation"
                  required
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={l.quantite}
                  onChange={(e) => updateLigne(i, { quantite: Math.max(1, Number(e.target.value)) })}
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={l.prixUnitaireEuros || ""}
                  onChange={(e) => updateLigne(i, { prixUnitaireEuros: Number(e.target.value) })}
                  placeholder="0.00"
                  className="px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
                />
                <select
                  value={l.tvaRate}
                  onChange={(e) => updateLigne(i, { tvaRate: e.target.value })}
                  className="px-2 py-2 rounded-lg bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
                >
                  {TVA_RATES.map((r) => (
                    <option key={r} value={r}>{r}%</option>
                  ))}
                </select>
                <span className="text-right text-white text-sm font-medium tabular-nums sm:block hidden">
                  {fmt(ttc)}
                </span>
                <button
                  type="button"
                  onClick={() => removeLigne(i)}
                  disabled={lignes.length === 1}
                  className="text-slate-600 hover:text-red-400 disabled:opacity-30 transition-colors justify-self-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Totaux */}
        <div className="border-t border-white/10 px-5 py-4 flex justify-end">
          <div className="w-64 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">Total HT</span>
              <span className="text-white tabular-nums">{fmt(totals.ht)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-400">TVA</span>
              <span className="text-white tabular-nums">{fmt(totals.tva)}</span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-1.5 mt-1.5">
              <span className="text-white flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5 text-sky-400" /> Total TTC
              </span>
              <span className="text-sky-400 text-base tabular-nums">{fmt(totals.ttc)}</span>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href="/admin/devis"
          className="px-5 py-2.5 text-slate-400 hover:text-white border border-white/10 rounded-xl text-sm transition-colors"
        >
          Annuler
        </Link>
        <button
          type="submit"
          disabled={loading || lignes.length === 0}
          className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white font-semibold text-sm rounded-xl transition-all"
        >
          {loading ? "Création…" : "Créer le devis"}
        </button>
      </div>
    </form>
  );
}
