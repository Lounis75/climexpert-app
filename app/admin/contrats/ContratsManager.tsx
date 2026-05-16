"use client";

import { useState } from "react";
import {
  Plus, X, Check, Trash2, Calendar, User,
  FileText, ToggleLeft, ToggleRight,
} from "lucide-react";
import type { ContratWithClient } from "@/lib/contrats";
import type { Client } from "@/lib/clients";

const inputCls = "w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50";

interface Form {
  clientId: string;
  units: string;
  prixUnitaireEuros: string;
  startDate: string;
  nextVisit: string;
}
const emptyForm: Form = { clientId: "", units: "1", prixUnitaireEuros: "200", startDate: "", nextVisit: "" };

function fmt(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(nextVisit: string | null | undefined) {
  if (!nextVisit) return false;
  return new Date(nextVisit) < new Date();
}

export default function ContratsManager({
  initialContrats,
  clients,
}: {
  initialContrats: ContratWithClient[];
  clients: Client[];
}) {
  const [contrats, setContrats] = useState<ContratWithClient[]>(initialContrats);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [editingVisit, setEditingVisit] = useState<string | null>(null);
  const [visitDate, setVisitDate] = useState("");

  const actifs = contrats.filter((c) => c.active);
  const inactifs = contrats.filter((c) => !c.active);
  const caAnnuel = actifs.reduce((s, c) => s + c.units * c.prixUnitaireCt, 0);
  const overdue = actifs.filter((c) => isOverdue(c.nextVisit)).length;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientId || !form.startDate) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/contrats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: form.clientId,
          units: Number(form.units),
          prixUnitaireEuros: Number(form.prixUnitaireEuros),
          startDate: form.startDate,
          nextVisit: form.nextVisit || undefined,
        }),
      });
      if (res.ok) {
        const { contrat } = await res.json();
        const client = clients.find((c) => c.id === form.clientId);
        setContrats((p) => [{ ...contrat, clientName: client?.name ?? "—" }, ...p]);
        setForm(emptyForm);
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(c: ContratWithClient) {
    setToggling(c.id);
    try {
      const res = await fetch("/api/admin/contrats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, active: !c.active }),
      });
      if (res.ok) {
        setContrats((p) => p.map((x) => x.id === c.id ? { ...x, active: !x.active } : x));
      }
    } finally {
      setToggling(null);
    }
  }

  async function handleUpdateVisit(id: string) {
    const res = await fetch("/api/admin/contrats", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, nextVisit: visitDate || null }),
    });
    if (res.ok) {
      setContrats((p) => p.map((x) => x.id === id ? { ...x, nextVisit: visitDate || null } : x));
      setEditingVisit(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce contrat définitivement ?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/contrats?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) setContrats((p) => p.filter((c) => c.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-slate-800/40 border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{actifs.length}</p>
          <p className="text-slate-400 text-xs mt-0.5">Contrats actifs</p>
        </div>
        <div className="bg-slate-800/40 border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{actifs.reduce((s, c) => s + c.units, 0)}</p>
          <p className="text-slate-400 text-xs mt-0.5">Unités sous contrat</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-400">
            {(caAnnuel / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €
          </p>
          <p className="text-emerald-600 text-xs mt-0.5">CA annuel estimé</p>
        </div>
        {overdue > 0 ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-red-400">{overdue}</p>
            <p className="text-red-500 text-xs mt-0.5">Visites en retard</p>
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{inactifs.length}</p>
            <p className="text-slate-400 text-xs mt-0.5">Inactifs</p>
          </div>
        )}
      </div>

      {/* Toolbar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Annuler" : "Nouveau contrat"}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
          <h3 className="text-white text-sm font-semibold">Nouveau contrat d&apos;entretien</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1.5">Client *</label>
              <select name="clientId" value={form.clientId} onChange={handleChange} required className={inputCls}>
                <option value="">Sélectionner un client...</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.city ? `— ${c.city}` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Nb d&apos;unités</label>
              <input name="units" type="number" min="1" value={form.units} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Prix unitaire (€/an)</label>
              <input name="prixUnitaireEuros" type="number" min="0" step="10" value={form.prixUnitaireEuros} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Date de début *</label>
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Prochaine visite</label>
              <input name="nextVisit" type="date" value={form.nextVisit} onChange={handleChange} className={inputCls} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={saving || !form.clientId || !form.startDate}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Enregistrement..." : "Créer le contrat"}
            </button>
            <p className="text-slate-500 text-xs">
              Total : {(Number(form.units) * Number(form.prixUnitaireEuros)).toLocaleString("fr-FR")} €/an
            </p>
          </div>
        </form>
      )}

      {/* Listes */}
      {contrats.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucun contrat d&apos;entretien pour l&apos;instant.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {actifs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actifs ({actifs.length})</h2>
              {actifs.map((c) => (
                <ContratCard
                  key={c.id}
                  c={c}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  toggling={toggling}
                  deleting={deleting}
                  editingVisit={editingVisit}
                  visitDate={visitDate}
                  setEditingVisit={(id) => { setEditingVisit(id); setVisitDate(c.nextVisit ?? ""); }}
                  setVisitDate={setVisitDate}
                  onUpdateVisit={handleUpdateVisit}
                />
              ))}
            </div>
          )}
          {inactifs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Inactifs ({inactifs.length})</h2>
              {inactifs.map((c) => (
                <ContratCard
                  key={c.id}
                  c={c}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  toggling={toggling}
                  deleting={deleting}
                  editingVisit={editingVisit}
                  visitDate={visitDate}
                  setEditingVisit={(id) => { setEditingVisit(id); setVisitDate(c.nextVisit ?? ""); }}
                  setVisitDate={setVisitDate}
                  onUpdateVisit={handleUpdateVisit}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ContratCard({
  c, onToggle, onDelete, toggling, deleting,
  editingVisit, visitDate, setEditingVisit, setVisitDate, onUpdateVisit,
}: {
  c: ContratWithClient;
  onToggle: (c: ContratWithClient) => void;
  onDelete: (id: string) => void;
  toggling: string | null;
  deleting: string | null;
  editingVisit: string | null;
  visitDate: string;
  setEditingVisit: (id: string) => void;
  setVisitDate: (v: string) => void;
  onUpdateVisit: (id: string) => void;
}) {
  const overdue = isOverdue(c.nextVisit);
  const montant = (c.units * c.prixUnitaireCt / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0 });

  return (
    <div className={`bg-slate-800/40 border rounded-2xl p-4 ${!c.active ? "opacity-50 border-white/5" : overdue ? "border-red-500/30" : "border-white/8"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="flex items-center gap-1.5 text-white font-semibold text-sm">
              <User className="w-3.5 h-3.5 text-slate-500" /> {c.clientName}
            </span>
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-slate-300 text-xs">{c.units} unité{c.units > 1 ? "s" : ""}</span>
            <span className="text-emerald-400 text-xs font-medium">{montant} €/an</span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Début : {fmt(c.startDate)}
            </span>
            {editingVisit === c.id ? (
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="bg-slate-700 border border-white/10 rounded px-2 py-0.5 text-white text-xs focus:outline-none focus:border-sky-500/50"
                />
                <button onClick={() => onUpdateVisit(c.id)} className="text-emerald-400 hover:text-emerald-300 transition-colors">
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setEditingVisit("")} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            ) : (
              <button
                onClick={() => setEditingVisit(c.id)}
                className={`flex items-center gap-1 hover:text-white transition-colors ${overdue ? "text-red-400" : ""}`}
              >
                <Calendar className="w-3 h-3" />
                Prochaine visite : {c.nextVisit ? fmt(c.nextVisit) : "non planifiée"}
                {overdue && " ⚠️"}
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onToggle(c)}
            disabled={toggling === c.id}
            title={c.active ? "Désactiver" : "Réactiver"}
            className="text-slate-500 hover:text-sky-400 transition-colors disabled:opacity-40"
          >
            {c.active
              ? <ToggleRight className="w-5 h-5 text-emerald-400" />
              : <ToggleLeft className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onDelete(c.id)}
            disabled={deleting === c.id}
            title="Supprimer"
            className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
