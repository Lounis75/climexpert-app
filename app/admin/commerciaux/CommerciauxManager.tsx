"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ExternalLink, UserCheck, Mail } from "lucide-react";

type Commercial = {
  id: string;
  name: string;
  prenom: string | null;
  email: string;
  phone: string | null;
  color: string | null;
  actif: boolean;
  active: boolean;
};

const COLORS = ["#8b5cf6", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

export default function CommerciauxManager() {
  const [list,    setList]    = useState<Commercial[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", prenom: "", email: "", phone: "", color: COLORS[0] });
  const [saving, setSaving]   = useState(false);
  const [error,  setError]    = useState("");

  async function fetchList() {
    setLoading(true);
    try {
      const res  = await fetch("/api/admin/commerciaux");
      const data = await res.json();
      setList(data.commerciaux ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchList(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res  = await fetch("/api/admin/commerciaux", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setList(prev => [data.commercial, ...prev]);
      setForm({ name: "", prenom: "", email: "", phone: "", color: COLORS[0] });
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce commercial ?")) return;
    await fetch(`/api/admin/commerciaux?id=${id}`, { method: "DELETE" });
    setList(prev => prev.filter(c => c.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Add button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          Ajouter un commercial
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-800 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="text-white font-semibold text-sm">Nouveau commercial</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Prénom</label>
              <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                placeholder="Kamel" className="w-full bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Nom *</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Benali" required className="w-full bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="kamel@climexpert.fr" required className="w-full bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Téléphone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="06 12 34 56 78" className="w-full bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Couleur</label>
            <div className="flex gap-2">
              {COLORS.map(c => (
                <button type="button" key={c} onClick={() => setForm(f => ({ ...f, color: c }))}
                  className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
              {saving ? "Création…" : "Créer le compte"}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-white/10 text-slate-400 hover:text-white text-sm rounded-xl transition-colors">
              Annuler
            </button>
          </div>
          <p className="text-slate-500 text-xs">Le commercial recevra un email avec son lien de connexion à <strong className="text-slate-400">climexpert.fr/commercial</strong></p>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="bg-slate-800 border border-white/10 rounded-2xl p-5 animate-pulse h-20" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-slate-800 border border-white/10 rounded-2xl p-10 text-center">
          <UserCheck className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">Aucun commercial enregistré.</p>
          <p className="text-slate-600 text-xs mt-1">Ajoutez votre premier commercial ci-dessus.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(c => (
            <div key={c.id} className="bg-slate-800 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: c.color ?? "#8b5cf6" }}>
                {(c.prenom ?? c.name)[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{c.prenom ? `${c.prenom} ${c.name}` : c.name}</p>
                <p className="text-slate-400 text-xs flex items-center gap-1 mt-0.5">
                  <Mail className="w-3 h-3" />{c.email}
                  {c.phone && <span className="ml-2">{c.phone}</span>}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${c.actif ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                  {c.actif ? "Actif" : "En attente"}
                </span>
                <a href="/commercial" target="_blank" rel="noopener"
                  className="p-2 text-slate-400 hover:text-white transition-colors" title="Voir portail">
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button onClick={() => handleDelete(c.id)}
                  className="p-2 text-slate-600 hover:text-red-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
