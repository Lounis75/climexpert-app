"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Phone, Bot, FileText, MapPin, Wrench,
  MessageSquare, Clock, LayoutList, Columns3, UserPlus, CheckCircle2,
  AlertTriangle, GitMerge, X, Search, Mail, ChevronRight, Briefcase, Plus,
  Pencil, Check, ShieldCheck, CalendarPlus,
} from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/leads";
import { detectDuplicates } from "@/lib/leads-utils";
import AddressAutocomplete from "@/components/AddressAutocomplete";

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string; col: string }> = {
  nouveau:          { label: "Nouveau",          color: "bg-sky-500/10 text-sky-400 border-sky-500/30",       col: "border-t-sky-500" },
  pas_de_reponse:   { label: "Pas de réponse",   color: "bg-rose-500/10 text-rose-400 border-rose-500/30",    col: "border-t-rose-500" },
  contacté:         { label: "Contact établi",   color: "bg-amber-500/10 text-amber-400 border-amber-500/30", col: "border-t-amber-500" },
  devis_envoyé:     { label: "Devis envoyé",     color: "bg-violet-500/10 text-violet-400 border-violet-500/30", col: "border-t-violet-500" },
  gagné:            { label: "Gagné",            color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", col: "border-t-emerald-500" },
  perdu:            { label: "Perdu",            color: "bg-slate-500/10 text-slate-400 border-slate-500/30", col: "border-t-slate-500" },
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

export default function LeadsManager({ initialLeads, initialSource }: { initialLeads: Lead[]; initialSource?: string }) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [sourceFilter, setSourceFilter] = useState(initialSource ?? "tous");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"kanban" | "liste">("kanban");
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertDone, setConvertDone] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState<LeadStatus | null>(null);
  const [mergingPanel, setMergingPanel] = useState<{ leadId: string; dupes: Lead[] } | null>(null);
  const [merging, setMerging] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const openedFromUrl = useRef(false);
  const searchParams = useSearchParams();
  // Ouvre directement la fiche du prospect ciblé via ?lead=<id> (lien depuis le dashboard).
  useEffect(() => {
    if (openedFromUrl.current) return;
    const leadId = searchParams.get("lead");
    if (!leadId) return;
    const found = leads.find((l) => l.id === leadId);
    if (found) { setSelectedLead(found); openedFromUrl.current = true; }
  }, [searchParams, leads]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", phone: "", source: "téléphone", project: "", location: "", address: "", email: "", notes: "", consentementMarketing: false });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [editingLead, setEditingLead] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", project: "", location: "", address: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const dragId = useRef<string | null>(null);
  const [commerciaux, setCommerciaux] = useState<{ id: string; name: string; prenom: string | null; color: string | null }[]>([]);

  useEffect(() => {
    // Liste des commerciaux affectables (inclut les administrateurs, qui ont tous les rôles).
    fetch("/api/admin/equipe").then(r => r.json()).then(d => setCommerciaux(d.commerciaux ?? [])).catch(() => {});
  }, []);

  const filtered = leads.filter((l) => {
    if (sourceFilter === "téléphone" && l.source !== "téléphone" && l.source !== "whatsapp") return false;
    if (sourceFilter !== "tous" && sourceFilter !== "téléphone" && l.source !== sourceFilter) return false;
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
    const previous = leads.find((l) => l.id === id)?.status;
    setUpdating(id);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      if (res.status === 401) {
        if (previous) setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: previous } : l)));
        window.location.href = "/admin";
        return;
      }
      if (res.ok) {
        setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: status as LeadStatus } : l)));
      } else {
        if (previous) setLeads((prev) => prev.map((l) => (l.id === id ? { ...l, status: previous } : l)));
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

  async function convertToClient(lead: Lead) {
    if (lead.clientId || convertDone.has(lead.id)) return; // déjà converti
    setConvertingId(lead.id);
    try {
      const address = (lead as Lead & { address?: string | null }).address ?? undefined;
      // Créer le client à partir du lead (avec l'adresse complète pour l'intervention)
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: lead.name,
          phone: lead.phone,
          email: lead.email ?? undefined,
          city: lead.location ?? undefined,
          address,
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
      // Met à jour le panneau ouvert → fait apparaître « Client créé » + « Créer l'intervention »
      setSelectedLead((prev) =>
        prev && prev.id === lead.id ? { ...prev, status: "gagné" as LeadStatus, clientId: client.id } : prev
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

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    if (!addForm.name.trim() || !addForm.phone.trim()) {
      setAddError("Nom et téléphone sont requis.");
      return;
    }
    setAdding(true);
    setAddError("");
    try {
      const res = await fetch("/api/admin/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      if (res.ok) {
        const { lead } = await res.json();
        setLeads((prev) => [lead, ...prev]);
        setShowAddModal(false);
        setAddForm({ name: "", phone: "", source: "téléphone", project: "", location: "", address: "", email: "", notes: "", consentementMarketing: false });
      } else {
        const data = await res.json();
        setAddError(data.error ?? "Erreur lors de la création.");
      }
    } finally {
      setAdding(false);
    }
  }

  function startEditLead(lead: Lead) {
    setEditForm({
      name: lead.name ?? "",
      phone: lead.phone ?? "",
      email: lead.email ?? "",
      project: lead.project ?? "",
      location: lead.location ?? "",
      address: (lead as Lead & { address?: string | null }).address ?? "",
    });
    setEditingLead(true);
  }

  async function saveLeadEdit(id: string) {
    if (!editForm.name.trim() || !editForm.phone.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...editForm }),
      });
      if (res.ok) {
        const { lead: updated } = await res.json();
        setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
        setSelectedLead(updated);
        setEditingLead(false);
      }
    } finally {
      setSavingEdit(false);
    }
  }

  // ─── Drag & drop ────────────────────────────────────────────────────────────

  function onDragStart(e: React.DragEvent, id: string) {
    dragId.current = id;
    // "Text" (capital T) is required for Safari — text/plain is not supported
    e.dataTransfer.setData("Text", id);
    e.dataTransfer.effectAllowed = "move";
  }

  function onDragOverColumn(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(status);
  }

  function onDragLeaveColumn(e: React.DragEvent) {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOver(null);
    }
  }

  async function onDropColumn(e: React.DragEvent, status: LeadStatus) {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(null);
    // Try both Safari legacy format and ref fallback
    const id = e.dataTransfer.getData("Text") || e.dataTransfer.getData("text/plain") || dragId.current;
    if (!id) return;
    const lead = leads.find((l) => l.id === id);
    if (!lead || lead.status === status) return;
    await updateStatus(id, status);
  }

  // ─── Card component ──────────────────────────────────────────────────────────

  function LeadCard({ lead }: { lead: Lead }) {
    const dupes = duplicatesMap.get(lead.id) ?? [];
    return (
      <div
        draggable
        onDragStart={(e) => onDragStart(e, lead.id)}
        onClick={() => setSelectedLead(lead)}
        className={`bg-slate-800/60 border rounded-xl p-2.5 transition-all cursor-pointer hover:border-sky-500/40 hover:bg-slate-800/80 select-none ${
          lead.status === "nouveau" ? "border-sky-500/20" : "border-white/8"
        }`}
      >
        {/* Source badge + date */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[10px] font-semibold ${
              lead.source === "alex"
                ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                : lead.source === "téléphone" || lead.source === "whatsapp"
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                : "bg-violet-500/10 text-violet-400 border-violet-500/20"
            }`}
          >
            {lead.source === "alex" ? <Bot className="w-2.5 h-2.5" /> : lead.source === "whatsapp" ? <MessageSquare className="w-2.5 h-2.5" /> : lead.source === "téléphone" ? <Phone className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
            {lead.source === "alex" ? "Alex" : lead.source === "whatsapp" ? "WhatsApp" : lead.source === "téléphone" ? "Tél." : "Form"}
          </span>
          <div className="flex items-center gap-1.5">
            {dupes.length > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setMergingPanel({ leadId: lead.id, dupes }); }}
                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border border-orange-500/40 bg-orange-500/10 text-orange-400 text-[10px] font-semibold hover:bg-orange-500/20 transition-colors"
              >
                <AlertTriangle className="w-2.5 h-2.5" />
                Doublon
              </button>
            )}
            <span className="text-slate-600 text-[10px] flex items-center gap-0.5">
              <Clock className="w-2.5 h-2.5" />
              {formatDate(lead.createdAt)}
            </span>
          </div>
        </div>

        {/* Name */}
        <p className="text-white font-semibold text-sm mb-1 truncate">{lead.name}</p>
        <p className="text-slate-400 text-xs mb-2 flex items-center gap-1">
          <Phone className="w-2.5 h-2.5 flex-shrink-0" />
          {lead.phone}
        </p>

        {/* Meta */}
        {(lead.project || lead.location) && (
          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
            {lead.project && (
              <span className="flex items-center gap-0.5">
                <Wrench className="w-2.5 h-2.5" />
                {PROJECT_LABELS[lead.project] ?? lead.project}
              </span>
            )}
            {lead.location && (
              <span className="flex items-center gap-0.5 truncate">
                <MapPin className="w-2.5 h-2.5 flex-shrink-0" />
                {lead.location}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const newCount = leads.filter((l) => l.status === "nouveau").length;

  return (
    <div>
      {/* Stats */}
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden mb-6">
        <div className="flex overflow-x-auto divide-x divide-white/8">
          {[
            { label: "Total",         value: leads.length,                                              dot: null },
            { label: "Nouveau",       value: leads.filter(l => l.status === "nouveau").length,          dot: "bg-sky-400" },
            { label: "Pas de rép.",   value: leads.filter(l => l.status === "pas_de_reponse").length,   dot: "bg-rose-400" },
            { label: "Contact",       value: leads.filter(l => l.status === "contacté").length,         dot: "bg-amber-400" },
            { label: "Devis",         value: leads.filter(l => l.status === "devis_envoyé").length,     dot: "bg-violet-400" },
            { label: "Gagné",         value: leads.filter(l => l.status === "gagné").length,            dot: "bg-emerald-400" },
            { label: "Perdu",         value: leads.filter(l => l.status === "perdu").length,            dot: "bg-slate-400" },
          ].map(({ label, value, dot }) => (
            <div key={label} className="flex-1 min-w-[80px] text-center py-3 px-2">
              <p className="text-xl font-bold text-white tabular-nums leading-none">{value}</p>
              <div className="flex items-center justify-center gap-1 mt-1.5">
                {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dot}`} />}
                <p className="text-slate-500 text-[10px] whitespace-nowrap">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Source filter */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: "tous", label: "Toutes sources" },
            { key: "alex", label: "Via Alex" },
            { key: "formulaire", label: "Formulaire" },
            { key: "téléphone", label: "Tél. / WhatsApp" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSourceFilter(key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                sourceFilter === key
                  ? "bg-sky-500 border-sky-500 text-white"
                  : "border-white/10 text-slate-400 hover:text-white hover:border-white/20"
              }`}
            >
              {label}
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

        {/* Add lead button */}
        <button
          onClick={() => { setShowAddModal(true); setAddError(""); }}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Ajouter un lead
        </button>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-xl p-1">
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
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          {STATUSES.map((status) => {
            const cfg = STATUS_CONFIG[status];
            const col = filtered.filter((l) => l.status === status);
            const isOver = dragOver === status;
            return (
              <div
                key={status}
                onDragEnter={(e) => { e.preventDefault(); setDragOver(status); }}
                onDragOver={(e) => onDragOverColumn(e, status)}
                onDragLeave={(e) => onDragLeaveColumn(e)}
                onDrop={(e) => onDropColumn(e, status)}
                className={`bg-slate-800/30 border-t-2 rounded-xl transition-all min-w-0 ${cfg.col} ${
                  isOver ? "ring-2 ring-sky-500/40 bg-slate-800/60" : "border-white/5"
                }`}
              >
                {/* Column header */}
                <div className="px-2.5 py-2 flex items-center justify-between border-b border-white/5 gap-1">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border truncate min-w-0 ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  <span className="text-slate-500 text-xs font-medium flex-shrink-0">{col.length}</span>
                </div>

                {/* Cards */}
                <div
                  className="p-1.5 space-y-1.5 min-h-32"
                  onDragEnter={(e) => { e.preventDefault(); setDragOver(status); }}
                  onDragOver={(e) => onDragOverColumn(e, status)}
                  onDrop={(e) => onDropColumn(e, status)}
                >
                  {col.length === 0 && (
                    <div
                      className={`h-24 rounded-lg border-2 border-dashed transition-all ${
                        isOver ? "border-sky-500/40" : "border-white/5"
                      }`}
                      onDragEnter={(e) => { e.preventDefault(); setDragOver(status); }}
                      onDragOver={(e) => onDragOverColumn(e, status)}
                      onDrop={(e) => onDropColumn(e, status)}
                    />
                  )}
                  {col.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                </div>
              </div>
            );
          })}
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
                      onClick={() => updateStatus(lead.id, "pas_de_reponse")}
                      disabled={updating === lead.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Pas de réponse
                    </button>
                  )}
                  {(lead.status === "nouveau" || lead.status === "pas_de_reponse") && (
                    <button
                      onClick={() => updateStatus(lead.id, "contacté")}
                      disabled={updating === lead.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      Contact établi
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

      {/* ── PANNEAU DÉTAIL LEAD ─────────────────────────────────────────────── */}
      {selectedLead && (() => {
        const lead = leads.find((l) => l.id === selectedLead.id) ?? selectedLead;
        const statusCfg = STATUS_CONFIG[lead.status];
        const isConverted = !!lead.clientId || convertDone.has(lead.id);
        const dupes = duplicatesMap.get(lead.id) ?? [];
        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end" onClick={() => { setSelectedLead(null); setEditingLead(false); }}>
            <div
              className="bg-slate-900 border-l border-white/10 w-full max-w-md h-full overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 sticky top-0 bg-slate-900 z-10">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold flex-shrink-0 ${
                    lead.source === "alex" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" : "bg-violet-500/10 text-violet-400 border-violet-500/20"
                  }`}>
                    {lead.source === "alex" ? <Bot className="w-2.5 h-2.5" /> : <FileText className="w-2.5 h-2.5" />}
                    {lead.source === "alex" ? "Alex" : "Formulaire"}
                  </span>
                  <h3 className="text-white font-semibold text-sm truncate">{lead.name}</h3>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                  {!editingLead && (
                    <button
                      onClick={() => startEditLead(lead)}
                      title="Modifier les coordonnées"
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button onClick={() => { setSelectedLead(null); setEditingLead(false); }} className="text-slate-500 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {editingLead ? (
                  /* ── Mode édition des coordonnées ── */
                  <div className="bg-slate-800/40 border border-sky-500/20 rounded-2xl p-4 space-y-3">
                    <p className="text-sky-400 text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5">
                      <Pencil className="w-3 h-3" /> Modifier les coordonnées
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 text-[11px] block mb-1">Nom *</label>
                        <input value={editForm.name} onChange={(e) => setEditForm(f => ({ ...f, name: e.target.value }))}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-sky-500/50" />
                      </div>
                      <div>
                        <label className="text-slate-400 text-[11px] block mb-1">Téléphone *</label>
                        <input value={editForm.phone} onChange={(e) => setEditForm(f => ({ ...f, phone: e.target.value }))}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-sky-500/50" />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">Email</label>
                      <input type="email" value={editForm.email} onChange={(e) => setEditForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-sky-500/50" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-slate-400 text-[11px] block mb-1">Projet</label>
                        <select value={editForm.project} onChange={(e) => setEditForm(f => ({ ...f, project: e.target.value }))}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm appearance-none focus:outline-none focus:border-sky-500/50">
                          <option value="">— Aucun —</option>
                          {Object.entries(PROJECT_LABELS).map(([val, lbl]) => (
                            <option key={val} value={val} className="bg-slate-800">{lbl}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-slate-400 text-[11px] block mb-1">Ville / CP</label>
                        <input value={editForm.location} onChange={(e) => setEditForm(f => ({ ...f, location: e.target.value }))}
                          className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-sky-500/50" />
                      </div>
                    </div>
                    <div>
                      <label className="text-slate-400 text-[11px] block mb-1">Adresse du chantier</label>
                      <AddressAutocomplete
                        value={editForm.address}
                        onChange={(v) => setEditForm(f => ({ ...f, address: v }))}
                        onSelect={(s) => setEditForm(f => ({ ...f, address: s.label, location: f.location || `${s.postcode} ${s.city}` }))}
                        placeholder="12 rue de la Paix, 75002 Paris"
                        className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50" />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => setEditingLead(false)}
                        className="flex-1 px-3 py-2 border border-white/10 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition-colors">
                        Annuler
                      </button>
                      <button onClick={() => saveLeadEdit(lead.id)} disabled={savingEdit || !editForm.name.trim() || !editForm.phone.trim()}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors">
                        {savingEdit ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                <>
                {/* Contact info */}
                <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-4 space-y-3">
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 bg-sky-500/10 border border-sky-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-sky-500/20 transition-colors">
                      <Phone className="w-3.5 h-3.5 text-sky-400" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm group-hover:text-sky-300 transition-colors">{lead.phone}</p>
                      <p className="text-slate-500 text-xs">Appuyer pour appeler</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-sky-400 transition-colors" />
                  </a>
                  {lead.email && (
                    <a href={`mailto:${lead.email}`} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 bg-violet-500/10 border border-violet-500/20 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-violet-500/20 transition-colors">
                        <Mail className="w-3.5 h-3.5 text-violet-400" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm truncate group-hover:text-violet-300 transition-colors">{lead.email}</p>
                        <p className="text-slate-500 text-xs">Email</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-600 ml-auto group-hover:text-violet-400 transition-colors" />
                    </a>
                  )}
                </div>

                {/* Project info */}
                <div className="grid grid-cols-2 gap-3">
                  {lead.project && (
                    <div className="bg-slate-800/40 border border-white/8 rounded-xl p-3">
                      <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">Projet</p>
                      <p className="text-white text-sm font-medium flex items-center gap-1.5">
                        <Wrench className="w-3 h-3 text-slate-400" />
                        {PROJECT_LABELS[lead.project] ?? lead.project}
                      </p>
                    </div>
                  )}
                  {/* Ville/CP : masquée si une adresse complète existe (la ville y figure déjà). */}
                  {lead.location && !(lead as Lead & { address?: string | null }).address && (
                    <div className="bg-slate-800/40 border border-white/8 rounded-xl p-3">
                      <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">Ville / CP</p>
                      <p className="text-white text-sm font-medium flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {lead.location}
                      </p>
                    </div>
                  )}
                  <div className="bg-slate-800/40 border border-white/8 rounded-xl p-3">
                    <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-1">Reçu le</p>
                    <p className="text-white text-sm font-medium flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {formatDate(lead.createdAt)}
                    </p>
                  </div>
                </div>

                {/* Adresse chantier */}
                {(lead as Lead & { address?: string | null }).address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent((lead as Lead & { address?: string | null }).address!)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 group"
                  >
                    <MapPin className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-slate-500 text-[10px] uppercase tracking-wide mb-0.5">Adresse d&apos;intervention</p>
                      <p className="text-emerald-300 text-sm font-medium group-hover:text-white transition-colors truncate">
                        {(lead as Lead & { address?: string | null }).address}
                      </p>
                    </div>
                  </a>
                )}
                </>
                )}

                {/* Statut */}
                <div>
                  <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wide">Statut</p>
                  <select
                    value={lead.status}
                    onChange={(e) => {
                      const newStatus = e.target.value as LeadStatus;
                      setSelectedLead({ ...lead, status: newStatus });
                      // Passer en « Gagné » crée automatiquement le client (comme une signature).
                      if (newStatus === "gagné" && !lead.clientId && !convertDone.has(lead.id)) {
                        convertToClient({ ...lead, status: newStatus });
                      } else {
                        updateStatus(lead.id, newStatus);
                      }
                    }}
                    disabled={updating === lead.id}
                    className={`text-xs font-semibold px-3 py-2 rounded-xl border bg-slate-800/60 cursor-pointer transition-opacity appearance-none w-full ${statusCfg.color} ${
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

                {/* Commercial */}
                {commerciaux.length > 0 && (
                  <div>
                    <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wide flex items-center gap-1.5">
                      <Briefcase className="w-3 h-3" /> Commercial assigné
                    </p>
                    <select
                      value={(lead as Lead & { commercialId?: string | null }).commercialId ?? ""}
                      onChange={async (e) => {
                        const commercialId = e.target.value || null;
                        const res = await fetch("/api/admin/leads", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ id: lead.id, commercialId }),
                        });
                        if (res.status === 401) { window.location.href = "/admin"; return; }
                        if (!res.ok) { alert("Échec de l'affectation du commercial. Réessayez."); return; }
                        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, commercialId } as Lead : l));
                        setSelectedLead(prev => prev ? { ...prev, commercialId } as Lead : null);
                      }}
                      className="w-full text-sm bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 appearance-none focus:outline-none focus:border-violet-500/50 cursor-pointer"
                    >
                      <option value="">— Aucun —</option>
                      {commerciaux.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.prenom ? `${c.prenom} ${c.name}` : c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Consentement RGPD (démarchage) */}
                <div>
                  <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" /> Démarchage commercial
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !(lead as Lead).consentementMarketing;
                      const res = await fetch("/api/admin/leads", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ id: lead.id, consentementMarketing: next }),
                      });
                      // Champ RGPD opposable : ne JAMAIS afficher un consentement non persisté.
                      if (res.status === 401) { window.location.href = "/admin"; return; }
                      if (!res.ok) { alert("Échec de l'enregistrement du consentement. Réessayez."); return; }
                      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, consentementMarketing: next } as Lead : l));
                      setSelectedLead(prev => prev ? { ...prev, consentementMarketing: next } as Lead : null);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                      (lead as Lead).consentementMarketing
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                        : "bg-slate-800/60 border-white/10 text-slate-400 hover:border-white/20"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {(lead as Lead).consentementMarketing ? <Check className="w-3.5 h-3.5" /> : null}
                      {(lead as Lead).consentementMarketing ? "Consentement donné" : "Pas de consentement"}
                    </span>
                    <span className="text-xs opacity-70">{(lead as Lead).consentementMarketing ? "Retirer" : "Marquer accordé"}</span>
                  </button>
                </div>

                {/* Notes */}
                <div>
                  <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wide">Note interne</p>
                  {editingNotes === lead.id ? (
                    <>
                      <textarea
                        value={notesValue}
                        onChange={(e) => setNotesValue(e.target.value)}
                        rows={4}
                        placeholder="Note interne..."
                        className="w-full text-sm bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500/50 resize-none"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => saveNotes(lead.id)}
                          disabled={updating === lead.id}
                          className="px-4 py-1.5 bg-sky-500/20 border border-sky-500/40 text-sky-400 rounded-lg text-xs font-medium hover:bg-sky-500/30 transition-colors disabled:opacity-50"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={() => setEditingNotes(null)}
                          className="px-4 py-1.5 text-slate-500 hover:text-slate-400 text-xs transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </>
                  ) : (
                    <div
                      className="text-slate-400 text-sm bg-slate-800/40 hover:bg-slate-800/60 border border-white/8 rounded-xl px-4 py-3 flex gap-2.5 cursor-pointer transition-colors group min-h-[60px]"
                      onClick={() => { setEditingNotes(lead.id); setNotesValue(lead.notes ?? ""); }}
                    >
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 group-hover:text-slate-300 text-slate-600" />
                      <span className="group-hover:text-slate-300 text-slate-500 whitespace-pre-wrap">{lead.notes || "Ajouter une note..."}</span>
                    </div>
                  )}
                </div>

                {/* Doublon */}
                {dupes.length > 0 && (
                  <button
                    onClick={() => { setSelectedLead(null); setMergingPanel({ leadId: lead.id, dupes }); }}
                    className="w-full flex items-center gap-2 px-4 py-3 bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 rounded-xl text-sm font-medium transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    {dupes.length} doublon{dupes.length > 1 ? "s" : ""} détecté{dupes.length > 1 ? "s" : ""}
                  </button>
                )}

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <a
                    href={`tel:${lead.phone}`}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Appeler
                  </a>
                  {lead.status === "gagné" ? (
                    <button
                      onClick={() => { if (!isConverted) convertToClient(lead); }}
                      disabled={convertingId === lead.id || isConverted}
                      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors border ${
                        isConverted
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 cursor-default"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      {isConverted ? <><CheckCircle2 className="w-4 h-4" /> Client créé</> : convertingId === lead.id ? <><span className="w-4 h-4 border border-emerald-400/50 border-t-emerald-400 rounded-full animate-spin" /> Conversion…</> : <><UserPlus className="w-4 h-4" /> Convertir</>}
                    </button>
                  ) : lead.status === "nouveau" ? (
                    <button
                      onClick={() => { updateStatus(lead.id, "pas_de_reponse"); setSelectedLead({ ...lead, status: "pas_de_reponse" }); }}
                      disabled={updating === lead.id}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Pas de réponse
                    </button>
                  ) : lead.status === "pas_de_reponse" ? (
                    <button
                      onClick={() => { updateStatus(lead.id, "contacté"); setSelectedLead({ ...lead, status: "contacté" }); }}
                      disabled={updating === lead.id}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      Contact établi
                    </button>
                  ) : null}
                </div>

                {/* Client gagné & converti → créer l'intervention (date + technicien) */}
                {lead.status === "gagné" && isConverted && lead.clientId && (
                  <Link
                    href={`/admin/interventions/new?client=${lead.clientId}`}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-xl text-sm font-semibold transition-colors mt-1"
                  >
                    <CalendarPlus className="w-4 h-4" /> Créer l&apos;intervention
                  </Link>
                )}

              </div>
            </div>
          </div>
        );
      })()}

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

      {/* ─── Modal ajout lead manuel ─────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/12 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div>
                <h2 className="text-white font-semibold text-sm">Ajouter un lead</h2>
                <p className="text-slate-500 text-xs mt-0.5">Contact téléphone ou WhatsApp</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleAddLead} className="px-6 py-5 space-y-4">
              {addError && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-xs">{addError}</div>
              )}

              {/* Source */}
              <div>
                <p className="text-slate-400 text-xs font-medium mb-2">Source *</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "téléphone", label: "Téléphone", icon: Phone },
                    { value: "whatsapp", label: "WhatsApp", icon: MessageSquare },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAddForm(f => ({ ...f, source: value }))}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                        addForm.source === value
                          ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                          : "border-white/10 bg-slate-800/60 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nom + Téléphone */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-medium block mb-1">Nom *</label>
                  <input
                    type="text"
                    value={addForm.name}
                    onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Prénom Nom"
                    required
                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium block mb-1">Téléphone *</label>
                  <input
                    type="tel"
                    value={addForm.phone}
                    onChange={e => setAddForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="06 00 00 00 00"
                    required
                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              {/* Type de projet */}
              <div>
                <label className="text-slate-400 text-xs font-medium block mb-1.5">Type de projet</label>
                <div className="flex flex-wrap gap-1.5">
                  {[["installation", "Installation"], ["entretien", "Entretien"], ["depannage", "Dépannage"], ["contrat-pro", "Contrat pro"], ["autre", "Autre"]].map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAddForm(f => ({ ...f, project: f.project === val ? "" : val }))}
                      className={`px-2.5 py-1 rounded-lg border text-xs font-medium transition-all ${
                        addForm.project === val
                          ? "border-sky-500/60 bg-sky-500/10 text-sky-300"
                          : "border-white/10 bg-slate-800/40 text-slate-400 hover:border-white/20"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ville + Email */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 text-xs font-medium block mb-1">Ville / CP</label>
                  <input
                    type="text"
                    value={addForm.location}
                    onChange={e => setAddForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="Paris 15 / 75015"
                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium block mb-1">Email</label>
                  <input
                    type="email"
                    value={addForm.email}
                    onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="email@exemple.fr"
                    className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                  />
                </div>
              </div>

              {/* Adresse */}
              <div>
                <label className="text-slate-400 text-xs font-medium block mb-1">Adresse du chantier</label>
                <AddressAutocomplete
                  value={addForm.address}
                  onChange={(v) => setAddForm(f => ({ ...f, address: v }))}
                  onSelect={(s) => setAddForm(f => ({ ...f, address: s.label, location: f.location || `${s.postcode} ${s.city}` }))}
                  placeholder="12 rue de la Paix, 75002 Paris"
                  className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-400 text-xs font-medium block mb-1">Notes internes</label>
                <textarea
                  value={addForm.notes}
                  onChange={e => setAddForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Détails sur la demande, contexte du contact…"
                  rows={3}
                  className="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50 resize-none"
                />
              </div>

              {/* Consentement RGPD (démarchage) */}
              <label className="flex items-start gap-2.5 cursor-pointer bg-slate-800/40 border border-white/8 rounded-xl px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={addForm.consentementMarketing}
                  onChange={e => setAddForm(f => ({ ...f, consentementMarketing: e.target.checked }))}
                  className="mt-0.5 w-4 h-4 rounded border-slate-500 bg-transparent text-sky-500 focus:ring-sky-500/40 flex-shrink-0"
                />
                <span className="text-slate-400 text-xs leading-relaxed">
                  Le contact <span className="text-slate-300 font-medium">accepte d&apos;être démarché</span> (offres commerciales).
                  À cocher uniquement si la personne a donné son accord.
                </span>
              </label>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2.5 border border-white/10 text-slate-400 hover:text-white rounded-xl text-sm font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={adding}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
                >
                  {adding ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  {adding ? "Création…" : "Créer le lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
