"use client";

import { useState } from "react";
import {
  Phone, Bot, FileText, MapPin, Wrench, Trash2,
  MessageSquare, Clock,
} from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/leads";

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  nouveau: { label: "Nouveau", color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  contacté: { label: "Contacté", color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  devis_envoyé: { label: "Devis envoyé", color: "bg-violet-500/10 text-violet-400 border-violet-500/30" },
  gagné: { label: "Gagné", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  perdu: { label: "Perdu", color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
};

const PROJECT_LABELS: Record<string, string> = {
  installation: "Installation",
  entretien: "Entretien",
  depannage: "Dépannage",
  "contrat-pro": "Contrat pro",
  autre: "Autre",
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function LeadsManager({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [sourceFilter, setSourceFilter] = useState("tous");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const filtered = leads
    .filter((l) => sourceFilter === "tous" || l.source === sourceFilter)
    .filter((l) => statusFilter === "tous" || l.status === statusFilter);

  const newCount = leads.filter((l) => l.status === "nouveau").length;
  const alexCount = leads.filter((l) => l.source === "alex").length;
  const contactCount = leads.filter((l) => l.source === "formulaire").length;

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((l) => (l.id === id ? { ...l, status: status as LeadStatus } : l))
        );
      }
    } finally {
      setUpdating(null);
    }
  }

  async function saveNotes(id: string) {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, notes: notesValue }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, notes: notesValue } : l)));
        setEditingNotes(null);
      }
    } finally {
      setUpdating(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce lead définitivement ?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/leads?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      }
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total leads", value: leads.length },
          { label: "Nouveaux", value: newCount },
          { label: "Via Alex", value: alexCount },
          { label: "Via Formulaire", value: contactCount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-slate-800/40 border border-white/8 rounded-2xl p-4">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-slate-400 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2">
          {["tous", "alex", "formulaire"].map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                sourceFilter === s
                  ? "bg-sky-500 border-sky-500 text-white"
                  : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              {s === "tous" ? "Toutes sources" : s === "alex" ? "Via Alex" : "Via Formulaire"}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {(["tous", "nouveau", "contacté", "devis_envoyé", "gagné", "perdu"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                statusFilter === s
                  ? "bg-sky-500 border-sky-500 text-white"
                  : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              {s === "tous" ? "Tous statuts" : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {leads.length === 0
              ? "Aucun lead pour l'instant. Les prospects via Alex et le formulaire apparaîtront ici."
              : "Aucun lead pour ces filtres."}
          </p>
        </div>
      )}

      {/* Leads list */}
      <div className="space-y-3">
        {filtered.map((lead) => {
          const statusCfg = STATUS_CONFIG[lead.status];
          return (
            <div
              key={lead.id}
              className={`bg-slate-800/40 border rounded-2xl p-4 transition-all ${
                lead.status === "nouveau" ? "border-sky-500/20" : "border-white/8"
              }`}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${
                      lead.source === "alex"
                        ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                        : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                    }`}
                  >
                    {lead.source === "alex" ? (
                      <Bot className="w-2.5 h-2.5" />
                    ) : (
                      <FileText className="w-2.5 h-2.5" />
                    )}
                    {lead.source === "alex" ? "Alex" : "Formulaire"}
                  </span>

                  <select
                    value={lead.status}
                    onChange={(e) => updateStatus(lead.id, e.target.value)}
                    disabled={updating === lead.id}
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-transparent cursor-pointer transition-opacity appearance-none ${statusCfg.color} ${
                      updating === lead.id ? "opacity-50 cursor-wait" : ""
                    }`}
                  >
                    {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
                      <option key={val} value={val} className="bg-slate-800 text-white text-xs">
                        {cfg.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(lead.createdAt)}
                  </span>
                  <button
                    onClick={() => handleDelete(lead.id)}
                    disabled={deleting === lead.id}
                    className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"
                    title="Supprimer ce lead"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Name + Phone */}
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-white font-semibold text-sm">{lead.name}</span>
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {lead.phone}
                </a>
              </div>

              {/* Details */}
              <div className="flex flex-wrap gap-3 text-xs text-slate-400 mb-2">
                {lead.project && (
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3 h-3" />
                    {PROJECT_LABELS[lead.project] ?? lead.project}
                  </span>
                )}
                {lead.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {lead.location}
                  </span>
                )}
              </div>

              {/* Notes */}
              {editingNotes === lead.id ? (
                <div className="mb-3">
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    rows={2}
                    placeholder="Ajouter une note interne..."
                    className="w-full text-xs bg-slate-700/50 border border-white/10 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 resize-none"
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button
                      onClick={() => saveNotes(lead.id)}
                      disabled={updating === lead.id}
                      className="px-3 py-1 bg-sky-500/20 border border-sky-500/40 text-sky-400 rounded-lg text-xs font-medium hover:bg-sky-500/30 transition-colors disabled:opacity-50"
                    >
                      Enregistrer
                    </button>
                    <button
                      onClick={() => setEditingNotes(null)}
                      className="px-3 py-1 text-slate-500 hover:text-slate-400 text-xs transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-slate-500 text-xs bg-slate-700/20 hover:bg-slate-700/40 rounded-lg px-3 py-2 flex gap-2 mb-3 cursor-pointer transition-colors group"
                  onClick={() => { setEditingNotes(lead.id); setNotesValue(lead.notes ?? ""); }}
                >
                  <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0 group-hover:text-slate-400" />
                  <span className="group-hover:text-slate-400">{lead.notes || "Ajouter une note..."}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 rounded-lg text-xs font-medium transition-colors"
                >
                  <Phone className="w-3 h-3" />
                  Appeler
                </a>
                {lead.status === "nouveau" && (
                  <button
                    onClick={() => updateStatus(lead.id, "contacté")}
                    disabled={updating === lead.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    Marquer contacté
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {leads.length > 0 && (
        <p className="text-slate-600 text-xs text-center mt-8">
          {leads.length} lead{leads.length > 1 ? "s" : ""} · {newCount} nouveau{newCount > 1 ? "x" : ""}
        </p>
      )}
    </div>
  );
}
