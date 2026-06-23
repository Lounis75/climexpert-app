"use client";

import { useState } from "react";
import { Plus, X, Mail, Phone, Check, Trash2, Send, ShieldCheck, KeyRound } from "lucide-react";
import { ROLES, ALL_ROLES, isValidRoleCombination, type Role } from "@/lib/roles";

interface Row {
  id: string;
  email: string;
  nom: string;
  prenom: string | null;
  phone: string | null;
  roles: string[];
  color: string | null;
  actif: boolean;
  hasAccess: boolean;
}

const emptyForm = { email: "", nom: "", prenom: "", phone: "", roles: [] as string[] };

export default function SalariesManager({ initial }: { initial: Row[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Row | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [sending, setSending] = useState<string | null>(null);
  const [sentMsg, setSentMsg] = useState<string | null>(null);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  }
  function openEdit(r: Row) {
    setEditing(r);
    setForm({ email: r.email, nom: r.nom, prenom: r.prenom ?? "", phone: r.phone ?? "", roles: r.roles });
    setError("");
    setShowModal(true);
  }

  function toggleRole(role: Role) {
    setForm((f) => {
      const has = f.roles.includes(role);
      let next: string[];
      if (has) next = f.roles.filter((r) => r !== role);
      else if (role === "administrateur") next = [...f.roles, role];
      else {
        // rôle métier exclusif : on remplace les autres rôles métier, on garde "administrateur" si présent
        const keptAdmin = f.roles.filter((r) => r === "administrateur");
        next = [...keptAdmin, role];
      }
      return { ...f, roles: next };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.email.trim() || !form.nom.trim()) { setError("Email et nom requis."); return; }
    if (!isValidRoleCombination(form.roles)) { setError("Sélectionnez au moins un rôle (combinaison valide)."); return; }
    setSaving(true);
    setError("");
    try {
      if (editing) {
        const res = await fetch("/api/admin/utilisateurs", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...form }),
        });
        const data = await res.json();
        if (res.ok) {
          setRows((p) => p.map((r) => (r.id === editing.id ? { ...r, ...data.utilisateur } : r)));
          setShowModal(false);
        } else setError(data.error ?? "Erreur");
      } else {
        const res = await fetch("/api/admin/utilisateurs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (res.ok) {
          setRows((p) => [...p, data.utilisateur]);
          setShowModal(false);
        } else setError(data.error ?? "Erreur");
      }
    } finally {
      setSaving(false);
    }
  }

  async function sendAccess(r: Row) {
    setSending(r.id);
    setSentMsg(null);
    try {
      const res = await fetch(`/api/admin/utilisateurs/${r.id}/send-access`, { method: "POST" });
      if (res.ok) {
        setRows((p) => p.map((x) => (x.id === r.id ? { ...x, hasAccess: true } : x)));
        setSentMsg(`Lien d'activation envoyé à ${r.email}`);
        setTimeout(() => setSentMsg(null), 4000);
      }
    } finally {
      setSending(null);
    }
  }

  async function toggleActif(r: Row) {
    const res = await fetch("/api/admin/utilisateurs", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: r.id, actif: !r.actif }),
    });
    if (res.ok) setRows((p) => p.map((x) => (x.id === r.id ? { ...x, actif: !r.actif } : x)));
  }

  async function remove(r: Row) {
    if (!window.confirm(`Retirer ${r.nom} de l'équipe ?`)) return;
    const res = await fetch(`/api/admin/utilisateurs?id=${r.id}`, { method: "DELETE" });
    if (res.ok) setRows((p) => p.filter((x) => x.id !== r.id));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-slate-500 text-xs">{rows.length} salarié{rows.length > 1 ? "s" : ""}</p>
        <button onClick={openCreate} className="flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-colors">
          <Plus className="w-3.5 h-3.5" /> Ajouter un salarié
        </button>
      </div>

      {sentMsg && (
        <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl px-4 py-2.5 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" /> {sentMsg}
        </div>
      )}

      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className={`bg-slate-800/40 border rounded-2xl p-4 flex items-center gap-4 ${r.actif ? "border-white/8" : "border-white/5 opacity-50"}`}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0" style={{ backgroundColor: (r.color ?? "#0ea5e9") + "33", color: r.color ?? "#0ea5e9" }}>
              {(r.prenom?.[0] ?? r.nom[0] ?? "?").toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-semibold text-sm">{r.prenom ? `${r.prenom} ${r.nom}` : r.nom}</span>
                {r.roles.filter((x): x is Role => x in ROLES).map((role) => (
                  <span key={role} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border" style={{ color: ROLES[role].color, borderColor: ROLES[role].color + "44", backgroundColor: ROLES[role].color + "15" }}>
                    {role === "administrateur" && <ShieldCheck className="w-2.5 h-2.5" />}
                    {ROLES[role].label}
                  </span>
                ))}
                {!r.hasAccess && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <KeyRound className="w-2.5 h-2.5" /> Accès non envoyé
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" /> {r.email}</span>
                {r.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {r.phone}</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={() => sendAccess(r)} disabled={sending === r.id} title="Envoyer le lien d'activation (le salarié choisit son mot de passe)" className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 text-xs font-medium transition-colors disabled:opacity-50">
                {sending === r.id ? <span className="w-3.5 h-3.5 border-2 border-sky-400/40 border-t-sky-400 rounded-full animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {r.hasAccess ? "Renvoyer" : "Envoyer l'accès"}
              </button>
              <button onClick={() => openEdit(r)} title="Modifier" className="w-8 h-8 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 flex items-center justify-center transition-colors">
                <KeyRound className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => toggleActif(r)} title={r.actif ? "Désactiver" : "Réactiver"} className="w-8 h-8 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 flex items-center justify-center transition-colors text-[10px]">
                {r.actif ? "ON" : "OFF"}
              </button>
              <button onClick={() => remove(r)} title="Retirer" className="w-8 h-8 rounded-lg border border-white/10 text-slate-600 hover:text-red-400 hover:border-red-500/30 flex items-center justify-center transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 && <p className="text-slate-600 text-sm text-center py-10">Aucun salarié. Cliquez sur « Ajouter un salarié ».</p>}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/12 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm">{editing ? "Modifier le salarié" : "Ajouter un salarié"}</h2>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/8"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={save} className="px-6 py-5 space-y-4">
              {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-xs">{error}</div>}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Prénom</label>
                  <input value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} className={inputCls} />
                </div>
                <div>
                  <label className="text-slate-400 text-xs block mb-1">Nom *</label>
                  <input value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required className={inputCls} />
                </div>
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Email (identifiant) *</label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required className={inputCls} />
              </div>
              <div>
                <label className="text-slate-400 text-xs block mb-1">Téléphone</label>
                <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={inputCls} />
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-2">Rôle(s), un admin peut cumuler, sinon un seul</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((role) => {
                    const active = form.roles.includes(role);
                    return (
                      <button key={role} type="button" onClick={() => toggleRole(role)}
                        className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${active ? "" : "border-white/10 bg-slate-800/60 text-slate-400 hover:border-white/20"}`}
                        style={active ? { color: ROLES[role].color, borderColor: ROLES[role].color + "66", backgroundColor: ROLES[role].color + "1a" } : undefined}>
                        {ROLES[role].label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-white/10 text-slate-400 hover:text-white rounded-xl text-sm font-medium transition-colors">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors">
                  {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
                  {editing ? "Enregistrer" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputCls = "w-full bg-slate-900/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50";
