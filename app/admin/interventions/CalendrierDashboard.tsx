"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { X, Plus, Check, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────
const HOUR_START   = 7;
const HOUR_END     = 20;
const TOTAL_HOURS  = HOUR_END - HOUR_START;
const PX_PER_HOUR  = 40;   // compact : toute la journée (7h-20h) visible d'un coup, sans scroll
const TOTAL_HEIGHT = TOTAL_HOURS * PX_PER_HOUR;

// ─── Types ────────────────────────────────────────────────────────────────────
type CalIntervention = {
  id: string; type: string; status: string; scheduledAt: string | null;
  address: string | null; technicienId: string | null; duree: number | null;
  clientName: string; technicienName: string | null;
};
type CalTechnicien = { id: string; name: string; color: string | null };
type SimpleClient   = { id: string; name: string; phone: string };
type CalRdv         = { id: string; clientName: string; rdvDate: string | null };

// ─── Lookup tables ────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  installation:  { bg: "bg-sky-500/15",     border: "border-sky-500/40",     text: "text-sky-300",     dot: "bg-sky-400" },
  entretien:     { bg: "bg-emerald-500/15", border: "border-emerald-500/40", text: "text-emerald-300", dot: "bg-emerald-400" },
  depannage:     { bg: "bg-red-500/15",     border: "border-red-500/40",     text: "text-red-300",     dot: "bg-red-400" },
  "contrat-pro": { bg: "bg-violet-500/15",  border: "border-violet-500/40",  text: "text-violet-300",  dot: "bg-violet-400" },
  autre:         { bg: "bg-slate-500/15",   border: "border-slate-500/40",   text: "text-slate-300",   dot: "bg-slate-400" },
};
const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Autre",
};
const DAYS_FR   = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const MONTHS_FR = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"];

// ─── Utils ────────────────────────────────────────────────────────────────────
function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMonths(d: Date, n: number) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }
function getMondayOf(d: Date) { const x = new Date(d); const dow = x.getDay(); x.setDate(x.getDate() + (dow === 0 ? -6 : 1 - dow)); x.setHours(0, 0, 0, 0); return x; }
function monthGridStart(d: Date) { return getMondayOf(new Date(d.getFullYear(), d.getMonth(), 1)); }
function monthGridEnd(d: Date) { return addDays(getMondayOf(new Date(d.getFullYear(), d.getMonth() + 1, 0)), 6); }
function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function topPx(d: Date)             { return Math.max(0, (d.getHours() + d.getMinutes() / 60 - HOUR_START) * PX_PER_HOUR); }
function heightPx(min: number)      { return Math.max(28, (min / 60) * PX_PER_HOUR); }
function fmtHM(d: Date)             { return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
function fmtISO(d: Date)            { return d.toISOString().slice(0, 16); }
function snapMinutes(min: number)   { return Math.round(min / 15) * 15; }

// ─── Quick-add modal ──────────────────────────────────────────────────────────
function QuickAddModal({
  initialDate, techniciens, onClose, onCreated,
}: {
  initialDate: Date;
  techniciens: CalTechnicien[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [clients, setClients]         = useState<SimpleClient[]>([]);
  const [search, setSearch]           = useState("");
  const [clientId, setClientId]       = useState("");
  const [clientLabel, setClientLabel] = useState("");
  const [showList, setShowList]       = useState(false);
  const [type, setType]               = useState("installation");
  const [scheduledAt, setScheduledAt] = useState(fmtISO(initialDate));
  const [duree, setDuree]             = useState(120);
  const [techId, setTechId]           = useState("");
  const [address, setAddress]         = useState("");
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/admin/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients ?? []));
    searchRef.current?.focus();
  }, []);

  const filtered = search.length > 0
    ? clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)).slice(0, 6)
    : [];

  function selectClient(c: SimpleClient) {
    setClientId(c.id);
    setClientLabel(`${c.name} · ${c.phone}`);
    setSearch("");
    setShowList(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!clientId) { setError("Sélectionnez un client"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId, type, scheduledAt,
          technicienId: techId || null,
          address: address || null,
          dureeEstimeeMinutes: duree,
        }),
      });
      if (!res.ok) { setError("Erreur lors de la création"); setSaving(false); return; }
      onCreated();
      onClose();
    } catch {
      setError("Erreur réseau");
      setSaving(false);
    }
  }

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const d = new Date(scheduledAt);
  const dateLabel = isNaN(d.getTime()) ? "" : `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div>
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" /> Nouvelle intervention
            </h2>
            {dateLabel && <p className="text-slate-500 text-xs mt-0.5">{dateLabel}</p>}
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="p-5 space-y-4">

          {/* Client search */}
          <div className="relative">
            <label className="text-xs text-slate-400 block mb-1.5">Client *</label>
            {clientId ? (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-white/10 rounded-xl">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="text-white text-sm flex-1 truncate">{clientLabel}</span>
                <button type="button" onClick={() => { setClientId(""); setClientLabel(""); }} className="text-slate-500 hover:text-white text-xs">
                  ×
                </button>
              </div>
            ) : (
              <div>
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setShowList(true); }}
                  onFocus={() => setShowList(true)}
                  placeholder="Nom ou téléphone…"
                  className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                {showList && filtered.length > 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-[#0f1623] border border-white/10 rounded-xl overflow-hidden shadow-xl">
                    {filtered.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => selectClient(c)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-left transition-colors"
                      >
                        <div className="w-7 h-7 rounded-lg bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sky-400 text-[10px] font-bold">{c.name[0]}</span>
                        </div>
                        <div>
                          <p className="text-white text-sm leading-tight">{c.name}</p>
                          <p className="text-slate-500 text-xs">{c.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showList && search.length > 1 && filtered.length === 0 && (
                  <div className="absolute z-10 left-0 right-0 mt-1 bg-[#0f1623] border border-white/10 rounded-xl px-3 py-3 text-slate-500 text-xs shadow-xl">
                    Aucun client trouvé
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Type + Durée */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Type *</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {Object.entries(TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Durée</label>
              <select
                value={duree}
                onChange={(e) => setDuree(Number(e.target.value))}
                className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {[30,60,90,120,180,240,300,360,480].map((m) => (
                  <option key={m} value={m}>{m < 60 ? `${m}min` : `${m/60}h`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Date + heure */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Date et heure *</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              required
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {/* Technicien */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Technicien</label>
            <select
              value={techId}
              onChange={(e) => setTechId(e.target.value)}
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">Non assigné</option>
              {techniciens.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Adresse */}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Adresse (optionnel)</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Ex : 12 rue de la Paix, Paris"
              className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all"
            >
              {saving ? "Création…" : "Créer l'intervention"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-all"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main calendar ────────────────────────────────────────────────────────────
export default function CalendrierDashboard() {
  const todayBase = new Date();
  todayBase.setHours(0, 0, 0, 0);

  const [viewMode, setViewMode]           = useState<"semaine" | "mois">("semaine");
  const [monthAnchor, setMonthAnchor]     = useState(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; });
  const [interventions, setInterventions] = useState<CalIntervention[]>([]);
  const [techniciens, setTechniciens]     = useState<CalTechnicien[]>([]);
  const [rdvs, setRdvs]                   = useState<CalRdv[]>([]);
  const [loading, setLoading]             = useState(true);
  const [dragId, setDragId]               = useState<string | null>(null);
  const dragRef = useRef<{ id: string; kind: "int" | "rdv"; grabPx: number; duree: number; origStart: number } | null>(null);
  const [nowY, setNowY]                   = useState<number | null>(null);
  const [modal, setModal]                 = useState<{ date: Date } | null>(null);
  const nowRef  = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const isMonth = viewMode === "mois";
  const days = Array.from({ length: 7 }, (_, i) => addDays(todayBase, i)); // vue semaine
  const monthStart = monthGridStart(monthAnchor);
  const monthDays = Array.from({ length: Math.round((monthGridEnd(monthAnchor).getTime() - monthStart.getTime()) / 86400000) + 1 }, (_, i) => addDays(monthStart, i));

  const load = useCallback(async () => {
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    let rangeStart: Date, rangeEnd: Date;
    if (viewMode === "mois") {
      rangeStart = monthGridStart(monthAnchor);
      rangeEnd = monthGridEnd(monthAnchor);
    } else {
      const t = new Date(); t.setHours(0, 0, 0, 0);
      rangeStart = t; rangeEnd = addDays(t, 6);
    }
    const res = await fetch(`/api/admin/calendrier?start=${fmt(rangeStart)}&end=${fmt(rangeEnd)}`);
    if (res.ok) {
      const d = await res.json();
      setInterventions(d.interventions ?? []);
      setTechniciens(d.techniciens ?? []);
      setRdvs(d.rdvs ?? []);
    }
    setLoading(false);
  }, [viewMode, monthAnchor]);

  useEffect(() => { load(); }, [load]);

  // Current time
  useEffect(() => {
    function update() {
      const n = new Date();
      const h = n.getHours() + n.getMinutes() / 60;
      setNowY(h >= HOUR_START && h <= HOUR_END ? (h - HOUR_START) * PX_PER_HOUR : null);
    }
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, []);

  // Scroll to now
  useEffect(() => {
    if (nowRef.current && gridRef.current) {
      gridRef.current.scrollTop = Math.max(0, (nowRef.current.offsetTop ?? 0) - 120);
    }
  }, [nowY]);

  const now = new Date();

  // Click on empty slot → compute date+time from click position
  function handleColumnClick(e: React.MouseEvent<HTMLDivElement>, day: Date) {
    // Don't trigger on event links
    if ((e.target as HTMLElement).closest("a")) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const relY  = e.clientY - rect.top;
    const totalMinFromStart = (relY / TOTAL_HEIGHT) * TOTAL_HOURS * 60;
    const snapped = snapMinutes(totalMinFromStart);
    const date = new Date(day);
    date.setHours(HOUR_START + Math.floor(snapped / 60), snapped % 60, 0, 0);
    setModal({ date });
  }

  const forDay = (d: Date) =>
    interventions.filter((i) => i.scheduledAt && isSameDay(new Date(i.scheduledAt), d) && i.status !== "annulée");

  const forDayRdv = (d: Date) =>
    rdvs.filter((r) => r.rdvDate && isSameDay(new Date(r.rdvDate), d));

  // ── Glisser-déposer pour déplacer un rendez-vous (comme le calendrier Apple) ──
  function onEventDragStart(e: React.DragEvent, id: string, kind: "int" | "rdv", duree: number, origStart: number) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = { id, kind, grabPx: e.clientY - rect.top, duree, origStart };
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", id); } catch { /* ignore */ }
  }

  async function applyMove(drag: NonNullable<typeof dragRef.current>, iso: string) {
    if (drag.kind === "int") {
      setInterventions((prev) => prev.map((i) => (i.id === drag.id ? { ...i, scheduledAt: iso } : i)));
      await fetch(`/api/admin/interventions/${drag.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "planifier", scheduledAt: iso, dureeEstimeeMinutes: drag.duree }),
      }).catch(() => {});
    } else {
      setRdvs((prev) => prev.map((r) => (r.id === drag.id ? { ...r, rdvDate: iso } : r)));
      await fetch(`/api/admin/leads`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: drag.id, rdvDate: iso }),
      }).catch(() => {});
    }
    load();
  }

  // Vue semaine : drop = nouveau jour + heure (selon la position verticale).
  async function onColumnDrop(e: React.DragEvent, day: Date) {
    e.preventDefault();
    const drag = dragRef.current;
    dragRef.current = null; setDragId(null);
    if (!drag) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const minFromStart = ((e.clientY - rect.top - drag.grabPx) / PX_PER_HOUR) * 60;
    const snapped = Math.max(0, snapMinutes(minFromStart));
    const newStart = new Date(day);
    newStart.setHours(HOUR_START + Math.floor(snapped / 60), snapped % 60, 0, 0);
    await applyMove(drag, newStart.toISOString());
  }

  // Vue mois : drop = nouveau jour, on garde l'heure d'origine.
  async function onMonthDayDrop(e: React.DragEvent, day: Date) {
    e.preventDefault();
    const drag = dragRef.current;
    dragRef.current = null; setDragId(null);
    if (!drag) return;
    const orig = new Date(drag.origStart);
    const newStart = new Date(day);
    newStart.setHours(orig.getHours() || 9, orig.getMinutes(), 0, 0);
    await applyMove(drag, newStart.toISOString());
  }

  return (
    <>
      {modal && (
        <QuickAddModal
          initialDate={modal.date}
          techniciens={techniciens}
          onClose={() => setModal(null)}
          onCreated={load}
        />
      )}

      {/* Bascule Semaine / Mois (+ navigation mois) */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {isMonth && (
            <>
              <button onClick={() => setMonthAnchor(addMonths(monthAnchor, -1))} className="p-1.5 rounded-lg bg-slate-800 border border-white/8 text-slate-400 hover:text-white transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-sm font-semibold text-white capitalize min-w-[140px] text-center">{monthAnchor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
              <button onClick={() => setMonthAnchor(addMonths(monthAnchor, 1))} className="p-1.5 rounded-lg bg-slate-800 border border-white/8 text-slate-400 hover:text-white transition-colors"><ChevronRight className="w-4 h-4" /></button>
              <button onClick={() => { const d = new Date(); d.setHours(0, 0, 0, 0); setMonthAnchor(d); }} className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-white/8 text-slate-400 hover:text-white transition-colors">Ce mois</button>
            </>
          )}
        </div>
        <div className="flex items-center rounded-xl bg-slate-800 border border-white/8 p-0.5">
          {(["semaine", "mois"] as const).map((m) => (
            <button key={m} onClick={() => setViewMode(m)} className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${viewMode === m ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}>{m}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isMonth ? (
        /* ── Vue MOIS ─────────────────────────────────────────────────── */
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 gap-1.5 mb-1.5 min-w-[600px]">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => <p key={d} className="text-[10px] text-slate-500 font-medium text-center">{d}</p>)}
          </div>
          <div className="grid grid-cols-7 gap-1.5 min-w-[600px]">
            {monthDays.map((d, idx) => {
              const inMonth = d.getMonth() === monthAnchor.getMonth();
              const isToday = isSameDay(d, now);
              const all: { kind: "int" | "rdv"; id: string; label: string; time: string; start: number; duree: number; type?: string }[] = [
                ...forDayRdv(d).map((r) => ({ kind: "rdv" as const, id: r.id, label: r.clientName, time: r.rdvDate ? fmtHM(new Date(r.rdvDate)) : "", start: r.rdvDate ? new Date(r.rdvDate).getTime() : 0, duree: 120 })),
                ...forDay(d).map((i) => ({ kind: "int" as const, id: i.id, label: i.clientName, time: i.scheduledAt ? fmtHM(new Date(i.scheduledAt)) : "", start: i.scheduledAt ? new Date(i.scheduledAt).getTime() : 0, duree: i.duree ?? 120, type: i.type })),
              ];
              return (
                <div key={idx}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                  onDrop={(e) => onMonthDayDrop(e, d)}
                  onClick={(e) => { if ((e.target as HTMLElement).closest("a")) return; const dd = new Date(d); dd.setHours(9, 0, 0, 0); setModal({ date: dd }); }}
                  className={`min-h-[92px] rounded-xl border p-1.5 flex flex-col cursor-pointer transition-colors hover:border-white/15 ${isToday ? "border-sky-500/50 bg-sky-500/5" : "border-white/8 bg-slate-800/30"} ${inMonth ? "" : "opacity-40"}`}>
                  <p className={`text-[11px] font-bold mb-1 ${isToday ? "text-sky-400" : "text-slate-400"}`}>{d.getDate()}</p>
                  <div className="space-y-0.5 overflow-hidden">
                    {all.slice(0, 3).map((ev) => {
                      const cfg = TYPE_COLORS[ev.type ?? "autre"] ?? TYPE_COLORS.autre;
                      return (
                        <Link key={`${ev.kind}-${ev.id}`}
                          href={ev.kind === "rdv" ? `/admin/leads?lead=${ev.id}` : `/admin/interventions/${ev.id}`}
                          onClick={(e) => e.stopPropagation()}
                          draggable
                          onDragStart={(e) => onEventDragStart(e, ev.id, ev.kind, ev.duree, ev.start)}
                          onDragEnd={() => { dragRef.current = null; setDragId(null); }}
                          className={`block rounded px-1 py-0.5 text-[9px] leading-tight truncate cursor-grab active:cursor-grabbing hover:opacity-80 ${ev.kind === "rdv" ? "bg-amber-500/20 text-amber-300" : `${cfg.bg} ${cfg.text}`} ${dragId === ev.id ? "opacity-40" : ""}`}>
                          {ev.time && <span className="opacity-70">{ev.time} </span>}{ev.kind === "rdv" ? "RDV " : ""}{ev.label}
                        </Link>
                      );
                    })}
                    {all.length > 3 && <p className="text-[9px] text-slate-500 px-1">+{all.length - 3}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">

          {/* ── Day headers ──────────────────────────────────────────────── */}
          <div className="flex min-w-[600px]">
            <div className="w-12 flex-shrink-0" />
            {days.map((d, idx) => {
              const isToday = isSameDay(d, now);
              const count   = forDay(d).length;
              return (
                <div key={idx} className="flex-1 flex flex-col items-center pb-2 border-b border-white/8">
                  <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide mt-1">{DAYS_FR[d.getDay()]}</p>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-0.5 ${isToday ? "bg-sky-500" : ""}`}>
                    <span className={`text-sm font-bold ${isToday ? "text-white" : "text-slate-300"}`}>{d.getDate()}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-[9px] text-slate-600">{MONTHS_FR[d.getMonth()]}</p>
                    {count > 0 && (
                      <span className={`text-[9px] font-bold ${isToday ? "text-sky-400" : "text-slate-500"}`}>· {count}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Hint ─────────────────────────────────────────────────────── */}
          <p className="text-[10px] text-slate-600 text-right pr-1 pt-1 pb-0.5">
            Cliquez sur un créneau pour ajouter · glissez un rendez-vous pour le déplacer
          </p>

          {/* ── Time grid ────────────────────────────────────────────────── */}
          <div ref={gridRef} className="overflow-y-auto max-h-[560px]">
            <div className="relative flex min-w-[600px]" style={{ height: TOTAL_HEIGHT }}>

              {/* Hour labels */}
              <div className="w-12 flex-shrink-0 relative pointer-events-none">
                {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
                  <div key={i} className="absolute right-2 text-[10px] text-slate-600 font-medium" style={{ top: i * PX_PER_HOUR - 7 }}>
                    {(HOUR_START + i).toString().padStart(2, "0")}h
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex-1 relative">
                {/* Hour lines */}
                {Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => (
                  <div key={i} className="absolute left-0 right-0 border-t border-white/[0.06]" style={{ top: i * PX_PER_HOUR }} />
                ))}
                {/* Half-hour lines */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div key={`h${i}`} className="absolute left-0 right-0 border-t border-white/[0.03]" style={{ top: i * PX_PER_HOUR + PX_PER_HOUR / 2 }} />
                ))}

                {/* Day columns */}
                <div className="absolute inset-0 flex">
                  {days.map((d, idx) => {
                    const isToday = isSameDay(d, now);
                    const events  = forDay(d);
                    const dayRdvs = forDayRdv(d);
                    return (
                      <div
                        key={idx}
                        onClick={(e) => handleColumnClick(e, d)}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                        onDrop={(e) => onColumnDrop(e, d)}
                        className={`flex-1 relative border-l cursor-pointer group ${
                          isToday ? "border-white/10 bg-sky-500/[0.02]" : "border-white/5"
                        }`}
                      >
                        {/* Hover overlay on empty slot */}
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="absolute inset-0 bg-white/[0.015] rounded-sm" />
                        </div>

                        {/* Plus icon on hover */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                          <div className="w-5 h-5 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center">
                            <Plus className="w-3 h-3 text-sky-400" />
                          </div>
                        </div>

                        {/* Events */}
                        {events.map((ev) => {
                          const start = new Date(ev.scheduledAt!);
                          const dur   = ev.duree ?? 60;
                          const top   = topPx(start);
                          const h     = heightPx(dur);
                          const c     = TYPE_COLORS[ev.type] ?? TYPE_COLORS.autre;
                          if (top > TOTAL_HEIGHT) return null;
                          const isShort = h < 44;

                          return (
                            <Link
                              key={ev.id}
                              href={`/admin/interventions/${ev.id}`}
                              onClick={(e) => e.stopPropagation()}
                              draggable
                              onDragStart={(e) => onEventDragStart(e, ev.id, "int", dur, start.getTime())}
                              onDragEnd={() => { dragRef.current = null; setDragId(null); }}
                              className={`absolute left-1 right-1 rounded-lg border px-2 py-1 overflow-hidden z-10 transition-opacity hover:opacity-80 cursor-grab active:cursor-grabbing ${c.bg} ${c.border} ${dragId === ev.id ? "opacity-40" : ""}`}
                              style={{ top, height: h }}
                            >
                              <div className="flex items-start gap-1.5 h-full overflow-hidden">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[3px] ${c.dot}`} />
                                <div className="flex-1 min-w-0">
                                  {isShort ? (
                                    <p className={`text-[10px] font-semibold leading-tight truncate ${c.text}`}>
                                      {fmtHM(start)} · {ev.clientName}
                                    </p>
                                  ) : (
                                    <>
                                      <p className={`text-[10px] font-semibold leading-tight ${c.text}`}>
                                        {fmtHM(start)}{dur !== 60 ? ` · ${dur < 60 ? dur + "min" : dur / 60 + "h"}` : ""}
                                      </p>
                                      <p className="text-white/85 text-[11px] font-medium leading-tight truncate mt-0.5">{ev.clientName}</p>
                                      <p className={`text-[10px] leading-tight truncate opacity-70 ${c.text}`}>
                                        {TYPE_LABELS[ev.type] ?? ev.type}{ev.technicienName ? ` · ${ev.technicienName}` : ""}
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}

                        {/* RDV commerciaux (prospects) — créneau 2h */}
                        {dayRdvs.map((r) => {
                          if (!r.rdvDate) return null;
                          const start = new Date(r.rdvDate);
                          const top = topPx(start);
                          const h = heightPx(120);
                          if (top > TOTAL_HEIGHT) return null;
                          const isShort = h < 44;
                          return (
                            <Link
                              key={r.id}
                              href={`/admin/leads?lead=${r.id}`}
                              onClick={(e) => e.stopPropagation()}
                              draggable
                              onDragStart={(e) => onEventDragStart(e, r.id, "rdv", 120, start.getTime())}
                              onDragEnd={() => { dragRef.current = null; setDragId(null); }}
                              className={`absolute left-1 right-1 rounded-lg border px-2 py-1 overflow-hidden z-10 transition-opacity hover:opacity-80 cursor-grab active:cursor-grabbing bg-amber-500/15 border-amber-500/40 ${dragId === r.id ? "opacity-40" : ""}`}
                              style={{ top, height: h }}
                            >
                              <div className="flex items-start gap-1.5 h-full overflow-hidden">
                                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[3px] bg-amber-400" />
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-semibold leading-tight text-amber-300">
                                    {fmtHM(start)} · RDV
                                  </p>
                                  {!isShort && (
                                    <p className="text-white/85 text-[11px] font-medium leading-tight truncate mt-0.5">{r.clientName}</p>
                                  )}
                                </div>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>

                {/* Current time line */}
                {nowY !== null && (
                  <div ref={nowRef} className="absolute left-0 right-0 flex items-center pointer-events-none z-20" style={{ top: nowY }}>
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 -ml-1.5 shadow-lg shadow-red-500/50" />
                    <div className="flex-1 h-px bg-red-500/80" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
