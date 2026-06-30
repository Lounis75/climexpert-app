"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Briefcase, Eye, EyeOff } from "lucide-react";

const CONTRATS = ["CDI", "CDD", "Intérim", "Alternance", "Stage", "Freelance"];

type Offre = {
  id: string; titre: string; resume: string | null; contrat: string; lieu: string | null;
  description: string; profil: string | null; actif: boolean; ordre: number;
};
type Draft = { id?: string; titre: string; resume: string; contrat: string; lieu: string; description: string; profil: string; actif: boolean; ordre: number };

const EMPTY: Draft = { titre: "", resume: "", contrat: "CDI", lieu: "Île-de-France", description: "", profil: "", actif: true, ordre: 0 };
const inp = "w-full bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50";

export default function RecrutementManager({ initial }: { initial: Offre[] }) {
  const [offres, setOffres] = useState<Offre[]>(initial);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function call(payload: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/recrutement", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? "Erreur, réessayez."); return false; }
      if (d.offres) setOffres(d.offres);
      return true;
    } catch { setError("Erreur réseau, réessayez."); return false; }
    finally { setBusy(false); }
  }

  async function save() {
    if (!draft) return;
    if (!draft.titre.trim() || !draft.description.trim()) { setError("Titre et description sont requis."); return; }
    const ok = await call({ action: draft.id ? "update" : "create", ...draft });
    if (ok) setDraft(null);
  }

  return (
    <div className="space-y-4">
      {!draft && (
        <button onClick={() => { setError(""); setDraft({ ...EMPTY, ordre: offres.length }); }} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Nouvelle annonce
        </button>
      )}

      {draft && (
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5 space-y-3">
          <p className="text-white font-semibold text-sm flex items-center gap-2"><Briefcase className="w-4 h-4 text-sky-400" /> {draft.id ? "Modifier l'annonce" : "Nouvelle annonce"}</p>
          <input value={draft.titre} onChange={(e) => setDraft({ ...draft, titre: e.target.value })} placeholder="Intitulé du poste (ex. Technicien frigoriste H/F)" className={inp} />
          <div>
            <input value={draft.resume} onChange={(e) => setDraft({ ...draft, resume: e.target.value })} maxLength={300} placeholder="Synthèse en 1 ligne (affichée dans la liste repliée)" className={inp} />
            <p className="text-slate-500 text-[11px] mt-1">Ex. : « Pose et mise en service de clim/PAC en IDF, équipe terrain. » Si vide, on prend le début de la description.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select value={draft.contrat} onChange={(e) => setDraft({ ...draft, contrat: e.target.value })} className={inp}>
              {CONTRATS.map((c) => <option key={c} value={c} className="bg-slate-800">{c}</option>)}
            </select>
            <input value={draft.lieu} onChange={(e) => setDraft({ ...draft, lieu: e.target.value })} placeholder="Lieu" className={inp} />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Missions / description</label>
            <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={5} placeholder="Décrivez le poste, les missions…" className={`${inp} resize-none`} />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Profil recherché (facultatif)</label>
            <textarea value={draft.profil} onChange={(e) => setDraft({ ...draft, profil: e.target.value })} rows={3} placeholder="Compétences, expérience, permis…" className={`${inp} resize-none`} />
          </div>
          <label className="flex items-center gap-2 text-slate-300 text-sm">
            <input type="checkbox" checked={draft.actif} onChange={(e) => setDraft({ ...draft, actif: e.target.checked })} /> Annonce visible sur le site
          </label>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button onClick={save} disabled={busy} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors"><Check className="w-4 h-4" /> {busy ? "…" : "Enregistrer"}</button>
            <button onClick={() => { setDraft(null); setError(""); }} className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors">Annuler</button>
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {offres.length === 0 && !draft && <p className="text-slate-500 text-sm">Aucune annonce pour l&apos;instant. Crée la première.</p>}
        {offres.map((o) => (
          <div key={o.id} className={`bg-slate-800/40 border rounded-xl p-4 ${o.actif ? "border-white/8" : "border-white/8 opacity-60"}`}>
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white font-semibold text-sm">{o.titre}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/30">{o.contrat}</span>
                  {!o.actif && <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-white/10">Masquée</span>}
                </div>
                <p className="text-slate-400 text-xs mt-1">{o.lieu}</p>
                <p className="text-slate-500 text-xs mt-1 line-clamp-2">{o.resume || o.description}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => call({ action: "toggle", id: o.id, actif: !o.actif })} disabled={busy} title={o.actif ? "Masquer" : "Afficher"} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                  {o.actif ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => { setError(""); setDraft({ id: o.id, titre: o.titre, resume: o.resume ?? "", contrat: o.contrat, lieu: o.lieu ?? "", description: o.description, profil: o.profil ?? "", actif: o.actif, ordre: o.ordre }); }} title="Modifier" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm("Supprimer cette annonce ?")) call({ action: "delete", id: o.id }); }} disabled={busy} title="Supprimer" className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
