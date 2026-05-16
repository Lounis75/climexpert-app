"use client";
import { useState } from "react";
import { Plus, Trash2, ChevronDown, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";

type Ticket = {
  id: string;
  status: string;
  subject: string;
  description: string | null;
  clientId: string;
  interventionId: string | null;
  createdAt: Date | string;
  clientName: string | null;
  clientPhone: string | null;
};

type Client = { id: string; name: string };

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  ouvert:   { label: "Ouvert",    color: "bg-red-100 text-red-700 border-red-200",     icon: AlertTriangle },
  en_cours: { label: "En cours",  color: "bg-amber-100 text-amber-700 border-amber-200", icon: Clock },
  résolu:   { label: "Résolu",    color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  fermé:    { label: "Fermé",     color: "bg-slate-100 text-slate-500 border-slate-200",  icon: XCircle },
};

const STATUSES = ["ouvert", "en_cours", "résolu", "fermé"];

function timeAgo(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `il y a ${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
}

export default function SavManager({ initialTickets, clients }: { initialTickets: Ticket[]; clients: Client[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [filter, setFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [clientId, setClientId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/sav", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, subject, description }),
    });
    const t = await res.json();
    if (res.ok) {
      const client = clients.find((c) => c.id === clientId);
      setTickets((prev) => [{ ...t, clientName: client?.name ?? null, clientPhone: null }, ...prev]);
      setShowForm(false); setClientId(""); setSubject(""); setDescription("");
    }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/admin/sav", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  }

  async function deleteTicket(id: string) {
    if (!confirm("Supprimer ce ticket SAV ?")) return;
    await fetch(`/api/admin/sav?id=${id}`, { method: "DELETE" });
    setTickets((prev) => prev.filter((t) => t.id !== id));
  }

  const visible = filter === "all" ? tickets : tickets.filter((t) => t.status === filter);

  return (
    <div className="space-y-6">
      {/* Filtres + bouton */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter === "all" ? "bg-sky-500/15 text-sky-400 border-sky-500/30" : "text-slate-400 border-white/10 hover:text-white"}`}
          >
            Tous ({tickets.length})
          </button>
          {STATUSES.map((s) => {
            const count = tickets.filter((t) => t.status === s).length;
            const { label } = STATUS_CONFIG[s];
            return (
              <button key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${filter === s ? "bg-sky-500/15 text-sky-400 border-sky-500/30" : "text-slate-400 border-white/10 hover:text-white"}`}
              >
                {label} ({count})
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Nouveau ticket
        </button>
      </div>

      {/* Formulaire création */}
      {showForm && (
        <form onSubmit={createTicket} className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 space-y-4">
          <p className="text-white text-sm font-semibold">Nouveau ticket SAV</p>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} required
              className="w-full bg-slate-900 border border-white/10 text-white text-sm rounded-xl px-3 py-2">
              <option value="">Sélectionner…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Objet</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required
              placeholder="Ex: Unité intérieure qui fuit"
              className="w-full bg-slate-900 border border-white/10 text-white text-sm rounded-xl px-3 py-2" />
          </div>
          <div>
            <label className="text-slate-400 text-xs block mb-1">Description (optionnel)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full bg-slate-900 border border-white/10 text-white text-sm rounded-xl px-3 py-2 resize-none" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)}
              className="flex-1 py-2 border border-white/10 text-slate-400 text-sm rounded-xl">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
              {saving ? "…" : "Créer"}
            </button>
          </div>
        </form>
      )}

      {/* Liste tickets */}
      {visible.length === 0 ? (
        <div className="text-center py-16 text-slate-500 text-sm">Aucun ticket.</div>
      ) : (
        <div className="space-y-3">
          {visible.map((t) => {
            const s = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.ouvert;
            const Icon = s.icon;
            return (
              <div key={t.id} className="bg-slate-800/50 border border-white/8 rounded-2xl p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${s.color}`}>
                      <Icon className="w-3 h-3" /> {s.label}
                    </span>
                    <span className="text-slate-400 text-xs">{t.clientName ?? "Client inconnu"}</span>
                    <span className="text-slate-600 text-xs">{timeAgo(t.createdAt)}</span>
                  </div>
                  <p className="text-white text-sm font-semibold">{t.subject}</p>
                  {t.description && <p className="text-slate-400 text-xs mt-1 line-clamp-2">{t.description}</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <select
                    value={t.status}
                    onChange={(e) => updateStatus(t.id, e.target.value)}
                    className="bg-slate-900 border border-white/10 text-slate-300 text-xs rounded-lg px-2 py-1.5"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
                  </select>
                  <button onClick={() => deleteTicket(t.id)} className="text-slate-600 hover:text-red-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
