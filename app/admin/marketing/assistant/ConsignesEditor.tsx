"use client";

import { useState } from "react";
import { Bot, Check, Clock } from "lucide-react";

export default function ConsignesEditor({ initial }: { initial: { delaiJours: number; consignes: string } }) {
  const [delai, setDelai] = useState(initial.delaiJours);
  const [consignes, setConsignes] = useState(initial.consignes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const dateApprox = new Date(Date.now() + (delai || 0) * 86400000).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  async function save() {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await fetch("/api/admin/marketing/alex-consignes", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delaiJours: delai, consignes }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? "Échec de l'enregistrement."); return; }
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch { setError("Erreur réseau, réessayez."); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      {/* Délai d'intervention */}
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
        <label className="text-slate-300 text-sm font-medium flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-sky-400" /> Délai d&apos;intervention actuel</label>
        <div className="flex items-center gap-2">
          <input type="number" min={1} value={delai} onChange={(e) => setDelai(parseInt(e.target.value) || 0)}
            className="w-28 bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500/50" />
          <span className="text-slate-400 text-sm">jours</span>
        </div>
        <p className="text-slate-500 text-xs mt-2">
          Alex dira : « comptez <b className="text-slate-300">environ {delai || 0} jours</b> (soit autour de {dateApprox}) ». Un chiffre relatif, jamais une date figée : tu le baisses quand tu as plus de capacité.
        </p>
      </div>

      {/* Consignes libres */}
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
        <label className="text-slate-300 text-sm font-medium block mb-2">Consignes du moment (texte libre)</label>
        <textarea value={consignes} onChange={(e) => setConsignes(e.target.value)} rows={5}
          placeholder="Ex. : On pousse les multisplits ce mois-ci. Relancer 1 fois si pas de réponse. Ton chaleureux et rassurant. Pour les pros, proposer une visite technique."
          className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50 resize-none" />
        <p className="text-slate-500 text-xs mt-2">Alex lit ces consignes à chaque conversation (chatbot du site et, bientôt, portail de qualification). Tu pilotes en français.</p>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
          {saved ? <Check className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
          {saving ? "Enregistrement…" : saved ? "Enregistré" : "Enregistrer les consignes"}
        </button>
        {error && <span className="text-red-400 text-sm">{error}</span>}
      </div>
    </div>
  );
}
