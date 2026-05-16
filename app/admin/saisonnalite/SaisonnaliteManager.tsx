"use client";
import { useState } from "react";
import { Plus, Trash2, Edit2, Check, X, AlertTriangle, Calendar } from "lucide-react";

type Periode = {
  id: string; nom: string; dateDebut: string; dateFin: string;
  maxInterventionsSemaine: number; note: string | null; createdAt: Date | string;
};

function fmt(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function isActive(p: Periode) {
  const now = new Date().toISOString().slice(0, 10);
  return p.dateDebut <= now && p.dateFin >= now;
}

function isUpcoming(p: Periode) {
  const now = new Date().toISOString().slice(0, 10);
  return p.dateDebut > now;
}

const empty = { nom: "", dateDebut: "", dateFin: "", maxInterventionsSemaine: 3, note: "" };

export default function SaisonnaliteManager({ initial }: { initial: Periode[] }) {
  const [periodes, setPeriodes] = useState(initial);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/saisonnalite", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
    });
    if (res.ok) {
      const { periode } = await res.json();
      setPeriodes((prev) => [...prev, periode].sort((a, b) => a.dateDebut.localeCompare(b.dateDebut)));
      setForm(empty);
      setShowForm(false);
    }
    setSaving(false);
  }

  async function update(id: string) {
    setSaving(true);
    await fetch("/api/admin/saisonnalite", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...editForm }),
    });
    setPeriodes((prev) => prev.map((p) =>
      p.id === id ? { ...p, ...editForm, maxInterventionsSemaine: Number(editForm.maxInterventionsSemaine) } : p,
    ));
    setEditId(null);
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette période ?")) return;
    await fetch("/api/admin/saisonnalite", {
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
    });
    setPeriodes((prev) => prev.filter((p) => p.id !== id));
  }

  function startEdit(p: Periode) {
    setEditId(p.id);
    setEditForm({ nom: p.nom, dateDebut: p.dateDebut, dateFin: p.dateFin, maxInterventionsSemaine: p.maxInterventionsSemaine, note: p.note ?? "" });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Périodes de capacité</h2>
          <p className="text-slate-400 text-sm mt-0.5">Définissez des limites d&apos;interventions par semaine pour chaque période.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-all"
        >
          <Plus className="w-3.5 h-3.5" /> Nouvelle période
        </button>
      </div>

      {showForm && (
        <form onSubmit={create} className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 space-y-4">
          <h3 className="text-white text-sm font-semibold flex items-center gap-2"><Calendar className="w-4 h-4 text-sky-400" /> Nouvelle période saisonnière</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Nom *</label>
              <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} required placeholder="Ex : Été 2026" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Max interventions / semaine *</label>
              <input type="number" min={1} max={50} value={form.maxInterventionsSemaine} onChange={(e) => setForm({ ...form, maxInterventionsSemaine: Number(e.target.value) })} required className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date début *</label>
              <input type="date" value={form.dateDebut} onChange={(e) => setForm({ ...form, dateDebut: e.target.value })} required className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Date fin *</label>
              <input type="date" value={form.dateFin} onChange={(e) => setForm({ ...form, dateFin: e.target.value })} required className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-slate-400 block mb-1">Note (optionnel)</label>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Ex : Pic d'activité climatisation" className="w-full bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all">
              {saving ? "Enregistrement…" : "Créer la période"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition-all">
              Annuler
            </button>
          </div>
        </form>
      )}

      {periodes.length === 0 ? (
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-10 text-center">
          <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Aucune période de saisonnalité définie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {periodes.map((p) => (
            <div key={p.id} className={`bg-slate-800/40 border rounded-2xl p-4 ${isActive(p) ? "border-amber-500/40" : "border-white/8"}`}>
              {editId === p.id ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={editForm.nom} onChange={(e) => setEditForm({ ...editForm, nom: e.target.value })} className="bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
                    <input type="number" min={1} value={editForm.maxInterventionsSemaine} onChange={(e) => setEditForm({ ...editForm, maxInterventionsSemaine: Number(e.target.value) })} className="bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
                    <input type="date" value={editForm.dateDebut} onChange={(e) => setEditForm({ ...editForm, dateDebut: e.target.value })} className="bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
                    <input type="date" value={editForm.dateFin} onChange={(e) => setEditForm({ ...editForm, dateFin: e.target.value })} className="bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
                    <input value={editForm.note} onChange={(e) => setEditForm({ ...editForm, note: e.target.value })} placeholder="Note" className="col-span-2 bg-slate-900/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500" />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => update(p.id)} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-all"><Check className="w-3 h-3" /> Sauvegarder</button>
                    <button onClick={() => setEditId(null)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs font-semibold rounded-xl transition-all"><X className="w-3 h-3" /> Annuler</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white font-semibold text-sm">{p.nom}</span>
                      {isActive(p) && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">En cours</span>}
                      {isUpcoming(p) && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">À venir</span>}
                      {!isActive(p) && !isUpcoming(p) && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-500/30">Passée</span>}
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      {fmt(p.dateDebut)} → {fmt(p.dateFin)} · Max <strong className="text-white">{p.maxInterventionsSemaine}</strong> interventions/semaine
                    </p>
                    {p.note && <p className="text-slate-500 text-xs mt-0.5">{p.note}</p>}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => remove(p.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
