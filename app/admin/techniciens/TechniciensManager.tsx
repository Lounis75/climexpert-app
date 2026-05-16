"use client";

import { useState } from "react";
import { Plus, X, Check, Trash2, Phone, Mail, UserCircle, ToggleLeft, ToggleRight } from "lucide-react";
import type { Technicien } from "@/lib/techniciens";

const COLORS = [
  "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
  "#8b5cf6", "#06b6d4", "#f97316", "#ec4899",
];

const inputCls = "w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50";

interface Form { name: string; email: string; phone: string; color: string }
const emptyForm: Form = { name: "", email: "", phone: "", color: "#3b82f6" };

export default function TechniciensManager({ initialTechniciens }: { initialTechniciens: Technicien[] }) {
  const [list, setList] = useState<Technicien[]>(initialTechniciens);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/techniciens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const { technicien } = await res.json();
        setList((p) => [technicien, ...p]);
        setForm(emptyForm);
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(t: Technicien) {
    setToggling(t.id);
    try {
      const res = await fetch("/api/admin/techniciens", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: t.id, active: !t.active }),
      });
      if (res.ok) {
        setList((p) => p.map((x) => x.id === t.id ? { ...x, active: !x.active } : x));
      }
    } finally {
      setToggling(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce technicien définitivement ?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/techniciens?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) setList((p) => p.filter((t) => t.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  const actifs = list.filter((t) => t.active);
  const inactifs = list.filter((t) => !t.active);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex gap-3">
          <div className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-white">{actifs.length}</p>
            <p className="text-slate-400 text-xs mt-0.5">Actifs</p>
          </div>
          <div className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3">
            <p className="text-2xl font-bold text-white">{list.length}</p>
            <p className="text-slate-400 text-xs mt-0.5">Total</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Annuler" : "Nouveau technicien"}
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
          <h3 className="text-white text-sm font-semibold">Nouveau technicien</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Nom *</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder="Jean Martin" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email *</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} required placeholder="jean@climexpert.fr" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Téléphone</label>
              <input name="phone" value={form.phone} onChange={handleChange} placeholder="06 00 00 00 00" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Couleur (planning)</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, color: c }))}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${form.color === c ? "border-white scale-110" : "border-transparent"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !form.name || !form.email}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Enregistrement..." : "Créer"}
            </button>
          </div>
        </form>
      )}

      {/* Liste techniciens actifs */}
      {list.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <UserCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucun technicien pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {actifs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actifs</h2>
              {actifs.map((t) => <TechnicienCard key={t.id} t={t} onToggle={handleToggle} onDelete={handleDelete} toggling={toggling} deleting={deleting} />)}
            </div>
          )}
          {inactifs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inactifs</h2>
              {inactifs.map((t) => <TechnicienCard key={t.id} t={t} onToggle={handleToggle} onDelete={handleDelete} toggling={toggling} deleting={deleting} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TechnicienCard({
  t, onToggle, onDelete, toggling, deleting,
}: {
  t: Technicien;
  onToggle: (t: Technicien) => void;
  onDelete: (id: string) => void;
  toggling: string | null;
  deleting: string | null;
}) {
  return (
    <div className={`bg-slate-800/40 border border-white/8 rounded-2xl p-4 flex items-center gap-4 ${!t.active ? "opacity-50" : ""}`}>
      {/* Couleur */}
      <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: t.color ?? "#3b82f6" }}>
        {t.name.charAt(0).toUpperCase()}
      </div>

      {/* Infos */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm">{t.name}</p>
        <div className="flex flex-wrap gap-3 mt-1 text-xs text-slate-400">
          <a href={`mailto:${t.email}`} className="flex items-center gap-1 hover:text-white transition-colors">
            <Mail className="w-3 h-3" /> {t.email}
          </a>
          {t.phone && (
            <a href={`tel:${t.phone}`} className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
              <Phone className="w-3 h-3" /> {t.phone}
            </a>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => onToggle(t)}
          disabled={toggling === t.id}
          title={t.active ? "Désactiver" : "Réactiver"}
          className="text-slate-500 hover:text-sky-400 transition-colors disabled:opacity-40"
        >
          {t.active
            ? <ToggleRight className="w-5 h-5 text-emerald-400" />
            : <ToggleLeft className="w-5 h-5" />}
        </button>
        <button
          onClick={() => onDelete(t.id)}
          disabled={deleting === t.id}
          title="Supprimer"
          className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
