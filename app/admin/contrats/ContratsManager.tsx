"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus, X, Check, Trash2, Calendar, User,
  FileText, ToggleLeft, ToggleRight, Pencil, ExternalLink, PenLine,
} from "lucide-react";
import type { ContratWithClient } from "@/lib/contrats";
import type { Client } from "@/lib/clients";
import { contratTotalEuros } from "@/lib/contrat-pricing";

const inputCls = "w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50";

interface Form {
  clientId: string;
  units: string;
  prixUnitaireEuros: string;
  startDate: string;
  nextVisit: string;
  fluide: string;
  marque: string;        // valeur de la liste OU "Autre"
  marqueAutre: string;   // saisie libre si marque === "Autre"
  puissanceKw: string;
  numeroSerie: string;
}
const emptyForm: Form = { clientId: "", units: "1", prixUnitaireEuros: "200", startDate: "", nextVisit: "", fluide: "R410A", marque: "", marqueAutre: "", puissanceKw: "", numeroSerie: "" };

// Principales marques de climatisation (unité extérieure).
const MARQUES = ["Daikin", "Mitsubishi Electric", "Atlantic", "Toshiba", "Panasonic", "LG", "Fujitsu", "Samsung", "Hitachi", "Gree"];

const isoDate = (d: string | Date | null | undefined) => (d ? new Date(d).toISOString().slice(0, 10) : "");

function fmt(d: string | Date | null | undefined) {
  if (!d) return "-";
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
  const [editingId, setEditingId] = useState<string | null>(null); // contrat en cours d'édition

  function startEdit(c: ContratWithClient) {
    setEditingId(c.id);
    setForm({
      clientId: c.clientId,
      units: String(c.units),
      prixUnitaireEuros: String(c.prixUnitaireCt / 100),
      startDate: isoDate(c.startDate),
      nextVisit: isoDate(c.nextVisit),
      fluide: c.fluide ?? "R410A",
      marque: c.marque ? (MARQUES.includes(c.marque) ? c.marque : "Autre") : "",
      marqueAutre: c.marque && !MARQUES.includes(c.marque) ? c.marque : "",
      puissanceKw: c.puissanceKw ?? "",
      numeroSerie: c.numeroSerie ?? "",
    });
    setShowForm(true);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/contrats", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingId,
          units: Number(form.units),
          prixUnitaireEuros: Number(form.prixUnitaireEuros),
          startDate: form.startDate,
          nextVisit: form.nextVisit || null,
          fluide: form.fluide,
          marque: form.marque === "Autre" ? form.marqueAutre.trim() : form.marque,
          puissanceKw: form.puissanceKw,
          numeroSerie: form.numeroSerie,
        }),
      });
      if (res.ok) {
        const { contrat } = await res.json();
        setContrats((p) => p.map((x) => x.id === editingId ? { ...x, ...contrat } : x));
        closeForm();
      }
    } finally {
      setSaving(false);
    }
  }

  const actifs = contrats.filter((c) => c.active);
  const inactifs = contrats.filter((c) => !c.active);
  const caAnnuel = actifs.reduce((s, c) => s + c.prixUnitaireCt, 0); // prixUnitaireCt = total annuel
  const overdue = actifs.filter((c) => isOverdue(c.nextVisit)).length;

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    // Quand le nb d'unités change, auto-suggère le prix total officiel (180 + 60/supp),
    // l'admin reste libre de l'ajuster ensuite.
    if (name === "units") {
      setForm((p) => ({ ...p, units: value, prixUnitaireEuros: String(contratTotalEuros(Number(value) || 1)) }));
      return;
    }
    // La prochaine visite est par défaut un an après le début (l'admin peut l'ajuster).
    if (name === "startDate") {
      const ny = value ? (() => { const d = new Date(value); d.setFullYear(d.getFullYear() + 1); return d.toISOString().slice(0, 10); })() : "";
      setForm((p) => ({ ...p, startDate: value, nextVisit: ny || p.nextVisit }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
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
          fluide: form.fluide,
          marque: form.marque === "Autre" ? form.marqueAutre.trim() : form.marque,
          puissanceKw: form.puissanceKw,
          numeroSerie: form.numeroSerie,
        }),
      });
      if (res.ok) {
        const { contrat } = await res.json();
        const client = clients.find((c) => c.id === form.clientId);
        setContrats((p) => [{ ...contrat, clientName: client?.name ?? "-" }, ...p]);
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
        <div className="bg-slate-800/40 border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-bold text-emerald-400">
            {(caAnnuel / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0 })} €
          </p>
          <p className="text-slate-400 text-xs mt-0.5">CA annuel estimé</p>
        </div>
        <div className="bg-slate-800/40 border border-white/8 rounded-xl p-4">
          {overdue > 0 ? (
            <>
              <p className="text-2xl font-bold text-red-400">{overdue}</p>
              <p className="text-slate-400 text-xs mt-0.5">Visites en retard</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-white">{inactifs.length}</p>
              <p className="text-slate-400 text-xs mt-0.5">Inactifs</p>
            </>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => (showForm ? closeForm() : setShowForm(true))}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Annuler" : "Nouveau contrat"}
        </button>
      </div>

      {/* Formulaire (création ou édition) */}
      {showForm && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
          <h3 className="text-white text-sm font-semibold">{editingId ? "Modifier le contrat d'entretien" : "Nouveau contrat d'entretien"}</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1.5">Client *</label>
              {editingId ? (
                <p className={`${inputCls} !bg-slate-800 text-slate-300`}>{contrats.find((c) => c.id === editingId)?.clientName ?? "-"}</p>
              ) : (
                <select name="clientId" value={form.clientId} onChange={handleChange} required className={inputCls}>
                  <option value="">Sélectionner un client...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} {c.city ? `- ${c.city}` : ""}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Marque (unité extérieure)</label>
              <select name="marque" value={form.marque} onChange={handleChange} className={inputCls}>
                <option value="">- Choisir -</option>
                {MARQUES.map((m) => <option key={m} value={m}>{m}</option>)}
                <option value="Autre">Autre…</option>
              </select>
            </div>
            {form.marque === "Autre" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Marque (à préciser)</label>
                <input name="marqueAutre" value={form.marqueAutre} onChange={handleChange} placeholder="Marque / modèle" className={inputCls} />
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Puissance (kW)</label>
              <input name="puissanceKw" value={form.puissanceKw} onChange={handleChange} placeholder="ex : 5,2" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">N° de série (unité extérieure)</label>
              <input name="numeroSerie" value={form.numeroSerie} onChange={handleChange} placeholder="ex : 1234567890" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Nb d&apos;unités intérieures</label>
              <input name="units" type="number" min="1" value={form.units} onChange={handleChange} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Prix total annuel (€)</label>
              <input name="prixUnitaireEuros" type="number" min="0" step="10" value={form.prixUnitaireEuros} onChange={handleChange} className={inputCls} />
              <p className="text-slate-600 text-[10px] mt-1">Standard : 200 € + 60 €/unité supp.</p>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Fluide frigorigène</label>
              <select name="fluide" value={form.fluide} onChange={handleChange} className={inputCls}>
                {["R410A", "R32", "R22", "R290", "R454B", "R407C", "R134a"].map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
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
              {saving ? "Enregistrement..." : editingId ? "Enregistrer les modifications" : "Créer le contrat"}
            </button>
            <p className="text-slate-500 text-xs">
              Total : {Number(form.prixUnitaireEuros).toLocaleString("fr-FR")} €/an
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
                  onEdit={startEdit}
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
                  onEdit={startEdit}
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
  editingVisit, visitDate, setEditingVisit, setVisitDate, onUpdateVisit, onEdit,
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
  onEdit: (c: ContratWithClient) => void;
}) {
  const overdue = isOverdue(c.nextVisit);
  const montant = (c.prixUnitaireCt / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0 });
  const [sendingSig, setSendingSig] = useState(false);
  const [sigSent, setSigSent]       = useState(false);

  async function envoyerSignature() {
    setSendingSig(true);
    try {
      const res = await fetch(`/api/admin/contrats/${c.id}/envoyer-signature`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setSigSent(true);
      else alert("⚠️ " + (d.error ?? "Échec de l'envoi"));
    } finally { setSendingSig(false); }
  }

  return (
    <div className={`bg-slate-800/40 border rounded-2xl p-4 ${!c.active ? "opacity-50 border-white/5" : overdue ? "border-red-500/30" : "border-white/8"}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Link href={`/admin/clients/${c.clientId}`} className="flex items-center gap-1.5 text-white font-semibold text-sm hover:text-sky-300 transition-colors group/cli">
              <User className="w-3.5 h-3.5 text-slate-500" /> {c.clientName}
              <ExternalLink className="w-3 h-3 text-slate-600 group-hover/cli:text-sky-400 transition-colors" />
            </Link>
            {c.numero && <span className="text-slate-500 text-[10px] font-mono bg-slate-900/40 border border-white/10 rounded px-1.5 py-0.5">{c.numero}</span>}
            <span className="text-slate-500 text-xs">·</span>
            <span className="text-slate-300 text-xs">{c.units} unité{c.units > 1 ? "s" : ""}</span>
            <span className="text-emerald-400 text-xs font-medium">{montant} €/an</span>
            {c.signeLe
              ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">✓ Signé</span>
              : (c.signatureDemandeeLe || sigSent) && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">Signature en attente</span>}
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
          {!c.signeLe && (
            <button
              onClick={envoyerSignature}
              disabled={sendingSig}
              title="Envoyer le contrat au client pour signature électronique à distance"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium hover:bg-emerald-500/20 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <PenLine className="w-3.5 h-3.5" /> {sendingSig ? "Envoi…" : (c.signatureDemandeeLe || sigSent) ? "Relancer" : "Envoyer signature"}
            </button>
          )}
          <a
            href={`/api/admin/contrats/${c.id}/document`}
            target="_blank"
            rel="noopener noreferrer"
            title="Générer le contrat (PDF)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs font-medium hover:bg-sky-500/20 transition-colors whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" /> Contrat PDF
          </a>
          <button
            onClick={() => onEdit(c)}
            title="Modifier le contrat"
            className="p-2 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-white/5 transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onToggle(c)}
            disabled={toggling === c.id}
            title={c.active ? "Désactiver" : "Réactiver"}
            className="p-1.5 rounded-lg text-slate-500 hover:text-sky-400 hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            {c.active
              ? <ToggleRight className="w-5 h-5 text-emerald-400" />
              : <ToggleLeft className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onDelete(c.id)}
            disabled={deleting === c.id}
            title="Supprimer"
            className="p-2 rounded-lg text-slate-600 hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-40"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
