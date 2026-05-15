"use client";

import { useState, useRef, useMemo } from "react";
import {
  Phone, Bot, FileText, MapPin, Wrench, Trash2,
  MessageSquare, Clock, LayoutList, Columns3, UserPlus, CheckCircle2,
  AlertTriangle, GitMerge, X, Search,
} from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/leads";
import { detectDuplicates } from "@/lib/leads-utils";

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; col: string }> = {
  nouveau:      { label: "Nouveau",      color: "bg-sky-500/10 text-sky-400 border-sky-500/30",      col: "border-t-sky-500" },
  contacté:     { label: "Contacté",     color: "bg-amber-500/10 text-amber-400 border-amber-500/30", col: "border-t-amber-500" },
  devis_envoyé: { label: "Devis envoyé", color: "bg-violet-500/10 text-violet-400 border-violet-500/30", col: "border-t-violet-500" },
  gagné:        { label: "Gagné",        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", col: "border-t-emerald-500" },
  perdu:        { label: "Perdu",        color: "bg-slate-500/10 text-slate-400 border-slate-500/30", col: "border-t-slate-500" },
};

const STATUSES = Object.keys(STATUS_CONFIG) as LeadStatus[];

const PROJECT_LABELS: Record<string, string> = {
  installation: "Installation",
  entretien: "Entretien",
  depannage: "Dépannage",
  "contrat-pro": "Contrat pro",
  autre: "Autre",
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function LeadsManager({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [sourceFilter, setSourceFilter] = useState("tous");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "liste">("kanban");
  const [updating, setUpdating] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertDone, setConvertDone] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);
  const [mergingPanel, setMergingPanel] = useState<{ leadId: string; dupes: Lead[] } | null>(null);
  const [merging, setMerging] = useState(false);
  const dragId = useRef<string | null>(null);

  const filtered = leads.filter((l) => {
    if (sourceFilter !== "tous" && l.source !== sourceFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        (l.location ?? "").toLowerCase().includes(q) ||
        (l.email ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });
  const duplicatesMap = useMemo(() => detectDuplicates(leads), [leads]);

  // ─── API helpers ────────────────────────────────────────────────────────────

  async function updateStatus(id: string, status: string) {
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: status as LeadStatus } : l)));
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
      const res = await fetch(`/api/admin/leads?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) setLeads((prev) => prev.filter((l) => l.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  async function convertToClient(lead: Lead) {
    setConvertingId(lead.id);
    try {
      // Créer le client à partir du lead
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone,
          email: lead.email ?? undefined,
          city: lead.location ?? undefined,
          leadId: lead.id,
        }),
      });
      if (!res.ok) return;
      const { client } = await res.json();

      // Lier le clientId au lead + passer en "gagné"
      await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, status: "gagné", clientId: client.id }),
      });

      setLeads((prev) =>
        prev.map((l) =>
          l.id === lead.id ? { ...l, status: "gagné" as LeadStatus, clientId: client.id } : l
        )
      );
      setConvertDone((prev) => new Set(prev).add(lead.id));
    } finally {
      setConvertingId(null);
    }
  }

  async function handleMerge(masterId: string, duplicateId: string) {
    setMerging(true);
    try {
      const res = await fetch("/api/admin/leads/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ masterId, duplicateId }),
      });
      if (res.ok) {
        const { lead } = await res.json();
        setLeads((prev) => prev
          .filter((l) => l.id !== duplicateId)
          .map((l) => (l.id === masterId ? lead : l))
        );
        setMergingPanel(null);
      }
    } finally {
      setMerging(false);
    }
  }

  // ─── Drag & drop ────────────────────────────────────────────────────────────

  function onDragStart(id: string) {
    dragId.current = id;
  }

  function onDragOverColumn(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault();
    setDragOver(status);
  }

  async function onDropColumn(status: LeadStatus) {
    setDragOver(null);
    const id = dragId.current;
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;
    // Optimistic update
    setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
    await updateStatus(id, status);
  }

  // ─── Card component ──────────────────────────────────────────────────────────

  function LeadCard({ lead, compact = false }: { lead: Lead; compact?: boolean }) {
    const statusCfg = STATUS_CONFIG[lead.status];
    const isConverted = !!lead.clientId || convertDone.has(lead.id);
    const dupes = duplicatesMap.get(lead.id) ?? [];
    return (
      <div
        draggable
        onDragStart={() => onDragStart(lead.id)}
        className={`bg-slate-800/60 border rounded-xl p-3 transition-all cursor-grab active:cursor-grabbing select-none ${
          lead.status === "nouveau" ? "border-sky-500/20" : "border-white/8"
        }`}
      >
        {/* Source badge + date */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${
              lead.source === "alex"
                ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                : "bg-violet-500/10 text-violet-400 border-violet-500/20"
            }`}
          >
            {lead.source === "alex" ? <Bot className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
            {lead.source === "alex" ? "Alex" : "Form"}
          </span>
          {dupes.length > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setMergingPanel({ leadId: lead.id, dupes }); }}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400 text-[10px] font-semibold hover:bg-orange-500/20 transition-colors"
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              Doublon
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-600 text-[10px] flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {formatDate(lead.createdAt)}
            </span>
            <button
              onClick={() => handleDelete(lead.id)}
              disabled={deleting === lead.id}
              className="text-slate-700 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Name + phone */}
        <p className="text-white font-semibold text-sm mb-1">{lead.name}</p>
        <a
          href={`tel:${lead.phone}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-1 text-sky-400 hover:text-sky-300 text-xs font-medium transition-colors mb-2"
        >
          <Phone className="w-3 h-3" />
          {lead.phone}
        </a>

        {/* Meta */}
        {(lead.project || lead.location) && (
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mb-2">
            {lead.project && (
              <span className="flex items-center gap-0.5">
                <Wrench className="w-2.5 h-2.5" />
                {PROJECT_LABELS[lead.project] ?? lead.project}
              </span>
            )}
            {lead.location && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {lead.location}
              </span>
            )}
          </div>
        )}

        {/* Notes */}
        {!compact && (
          editingNotes === lead.id ? (
            <div className="mb-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                rows={2}
                placeholder="Note interne..."
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full text-xs bg-slate-700/50 border border-white/10 rounded-lg px-2 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 resize-none cursor-text"
              />
              <div className="flex gap-2 mt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); saveNotes(lead.id); }}
                  disabled={updating === lead.id}
                  className="px-2 py-0.5 bg-sky-500/20 border border-sky-500/40 text-sky-400 rounded text-[10px] font-medium hover:bg-sky-500/30 transition-colors"
                >
                  Enregistrer
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingNotes(null); }}
                  className="px-2 py-0.5 text-slate-500 hover:text-slate-400 text-[10px] transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <div
              className="text-slate-600 text-[10px] bg-slate-700/20 hover:bg-slate-700/40 rounded px-2 py-1 flex gap-1.5 mb-2 cursor-pointer transition-colors group"
              onClick={(e) => { e.stopPropagation(); setEditingNotes(lead.id); setNotesValue(lead.notes ?? ""); }}
            >
              <MessageSquare className="w-2.5 h-2.5 mt-0.5 flex-shrink-0 group-hover:text-slate-400" />
              <span className="group-hover:text-slate-400 line-clamp-1">{lead.notes || "Note..."}</span>
            </div>
          )
        )}

        {/* Convert to client */}
        {lead.status === "gagné" && (
          <button
            onClick={(e) => { e.stopPropagation(); if (!isConverted) convertToClient(lead); }}
            disabled={convertingId === lead.id || isConverted}
            className={`w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
              isConverted
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 cursor-default"
                : "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
            }`}
          >
            {isConverted ? (
              <><CheckCircle2 className="w-3 h-3" /> Client créé</>
            ) : convertingId === lead.id ? (
              <><span className="w-3 h-3 border border-emerald-400/50 border-t-emerald-400 rounded-full animate-spin" /> Conversion…</>
            ) : (
              <><UserPlus className="w-3 h-3" /> Convertir en client</>
            )}
          </button>
        )}
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const newCount = leads.filter((l) => l.status === "nouveau").length;
  const alexCount = leads.filter((l) => l.source === "alex").length;
  const contactCount = leads.filter((l) => l.source === "formulaire").length;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
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

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Source filter */}
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

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, téléphone, ville…"
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-white/10 bg-slate-800/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* View toggle */}
        <div className="ml-auto flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setView("kanban")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === "kanban" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            Kanban
          </button>
          <button
            onClick={() => setView("liste")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              view === "liste" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            Liste
          </button>
        </div>
      </div>

      {/* Empty state */}
      {leads.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Aucun lead pour l&apos;instant. Les prospects via Alex et le formulaire apparaîtront ici.</p>
        </div>
      )}

      {/* ── KANBAN VIEW ─────────────────────────────────────────────────────── */}
      {view === "kanban" && leads.length > 0 && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {STATUSES.map((status) => {
              const cfg = STATUS_CONFIG[status];
              const col = filtered.filter((l) => l.status === status);
              const isOver = dragOver === status;
              return (
                <div
                  key={status}
                  onDragOver={(e) => onDragOverColumn(e, status)}
                  onDragLeave={() => setDragOver(null)}
                  onDrop={() => onDropColumn(status)}
                  className={`w-64 flex-shrink-0 bg-slate-800/30 border-t-2 rounded-xl transition-all ${cfg.col} ${
                    isOver ? "ring-2 ring-sky-500/40 bg-slate-800/60" : "border-white/5"
                  }`}
                >
                  {/* Column header */}
                  <div className="px-3 py-2.5 flex items-center justify-between border-b border-white/5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-slate-500 text-xs font-medium">{col.length}</span>
                  </div>

                  {/* Cards */}
                  <div className="p-2 space-y-2 min-h-24">
                    {col.length === 0 && (
                      <div className={`h-16 rounded-lg border-2 border-dashed transition-all ${
                        isOver ? "border-sky-500/40" : "border-white/5"
                      }`} />
                    )}
                    {col.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} compact />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── LISTE VIEW ──────────────────────────────────────────────────────── */}
      {view === "liste" && leads.length > 0 && (
        <div className="space-y-3">
          {filtered.map((lead) => {
            const statusCfg = STATUS_CONFIG[lead.status];
            const listDupes = duplicatesMap.get(lead.id) ?? [];
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
                      {lead.source === "alex" ? <Bot className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                      {lead.source === "alex" ? "Alex" : "Formulaire"}
                    </span>

                    {listDupes.length > 0 && (
                      <button
                        onClick={() => setMergingPanel({ leadId: lead.id, dupes: listDupes })}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400 text-[10px] font-semibold hover:bg-orange-500/20 transition-colors"
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Doublon possible
                      </button>
                    )}

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
                <div className="flex items-center gap-2 flex-wrap">
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
                  {lead.status === "gagné" && (
                    <button
                      onClick={() => { if (!lead.clientId && !convertDone.has(lead.id)) convertToClient(lead); }}
                      disabled={convertingId === lead.id || !!lead.clientId || convertDone.has(lead.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                        lead.clientId || convertDone.has(lead.id)
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      {lead.clientId || convertDone.has(lead.id) ? (
                        <><CheckCircle2 className="w-3 h-3" /> Client créé</>
                      ) : (
                        <><UserPlus className="w-3 h-3" /> Convertir en client</>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {leads.length > 0 && (
        <p className="text-slate-600 text-xs text-center mt-8">
          {leads.length} lead{leads.length > 1 ? "s" : ""} · {newCount} nouveau{newCount > 1 ? "x" : ""}
        </p>
      )}

      {/* ── MODAL FUSION DOUBLONS ────────────────────────────────────────────── */}
      {mergingPanel && (() => {
        const master = leads.find((l) => l.id === mergingPanel.leadId);
        if (!master) return null;
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <h3 className="text-white font-semibold text-sm">Doublons détectés</h3>
                </div>
                <button onClick={() => setMergingPanel(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-slate-400 text-xs">
                  Ces leads partagent le même numéro ou email. Tu peux fusionner un doublon dans le lead principal — les données manquantes seront copiées, les notes combinées, et le doublon supprimé.
                </p>

                {/* Master */}
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Lead principal (conservé)</p>
                  <div className="bg-slate-800/60 border border-sky-500/20 rounded-xl p-3">
                    <p className="text-white font-semibold text-sm">{master.name}</p>
                    <p className="text-sky-400 text-xs">{master.phone}</p>
                    {master.email && <p className="text-slate-400 text-xs">{master.email}</p>}
                    <p className="text-slate-500 text-[10px] mt-1">
                      {new Date(master.createdAt).toLocaleDateString("fr-FR")} · {STATUS_CONFIG[master.status].label}
                    </p>
                  </div>
                </div>

                {/* Duplicates */}
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Doublons (seront supprimés après fusion)</p>
                  <div className="space-y-2">
                    {mergingPanel.dupes.map((dupe) => (
                      <div key={dupe.id} className="bg-slate-800/40 border border-orange-500/20 rounded-xl p-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-white text-sm font-medium truncate">{dupe.name}</p>
                          <p className="text-slate-400 text-xs">{dupe.phone}</p>
                          <p className="text-slate-500 text-[10px] mt-0.5">
                            {new Date(dupe.createdAt).toLocaleDateString("fr-FR")} · {STATUS_CONFIG[dupe.status].label}
                          </p>
                        </div>
                        <button
                          onClick={() => handleMerge(master.id, dupe.id)}
                          disabled={merging}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 rounded-lg text-xs font-medium transition-colors flex-shrink-0 disabled:opacity-50"
                        >
                          {merging ? (
                            <span className="w-3 h-3 border border-orange-400/50 border-t-orange-400 rounded-full animate-spin" />
                          ) : (
                            <GitMerge className="w-3 h-3" />
                          )}
                          Fusionner
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
