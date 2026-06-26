"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { X, Plus, Check, ChevronLeft, ChevronRight, ChevronDown, Ban, Trash2, ExternalLink } from "lucide-react";

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
type CalTechnicien = { id: string; name: string; color: string | null; role?: string | null };
type SimpleClient   = { id: string; name: string; phone: string };
type CalRdv         = { id: string; leadId?: string; clientName: string; rdvDate: string | null; commercialId: string | null; commercialName: string | null; kind?: "rdv" | "visite"; duree?: number };
type CalIndispo     = { id: string; technicienId: string; dateDebut: string; dateFin: string; motif: string | null };

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
function snapMinutes(min: number)   { return Math.round(min / 30) * 30; }

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
              type="datetime-local" step={1800}
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

// ─── Modal "Bloquer un créneau" (indisponibilité) ──────────────────────────────
function IndispoModal({ techniciens, onClose, onCreated }: { techniciens: CalTechnicien[]; onClose: () => void; onCreated: () => void }) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const [technicienId, setTechnicienId] = useState(techniciens[0]?.id ?? "");
  const [fullDay, setFullDay]   = useState(true);
  const [du, setDu]             = useState(todayStr);
  const [au, setAu]             = useState(todayStr);
  const [heureFrom, setHeureFrom] = useState("08:00");
  const [heureTo, setHeureTo]   = useState("12:00");
  const [motif, setMotif]       = useState("");
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!technicienId) { setError("Choisissez un membre de l'équipe"); return; }
    // Construit depuis l'heure LOCALE puis envoie en ISO (UTC) → round-trip correct côté grille.
    const debut = fullDay ? new Date(`${du}T00:00:00`) : new Date(`${du}T${heureFrom}:00`);
    const fin   = fullDay ? new Date(`${au || du}T23:59:59`) : new Date(`${du}T${heureTo}:00`);
    if (isNaN(debut.getTime()) || isNaN(fin.getTime()) || fin < debut) { setError("Plage invalide"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/disponibilites", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicienId, dateDebut: debut.toISOString(), dateFin: fin.toISOString(), motif }),
      });
      if (!res.ok) { setError("Erreur lors de l'enregistrement"); setSaving(false); return; }
      onCreated(); onClose();
    } catch { setError("Erreur réseau"); setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm flex items-center gap-2"><Ban className="w-4 h-4 text-amber-400" /> Bloquer un créneau</h2>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/5"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Membre de l&apos;équipe *</label>
            <select value={technicienId} onChange={(e) => setTechnicienId(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-sky-500">
              {techniciens.length === 0 && <option value="">Aucun membre</option>}
              {techniciens.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="flex items-center rounded-xl bg-slate-800 border border-white/8 p-0.5">
            {([["Journée(s) entière(s)", true], ["Créneau horaire", false]] as const).map(([label, v]) => (
              <button key={label} type="button" onClick={() => setFullDay(v)} className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${fullDay === v ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}>{label}</button>
            ))}
          </div>
          {fullDay ? (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs text-slate-400 block mb-1.5">Du *</label><input type="date" value={du} onChange={(e) => { setDu(e.target.value); if (au < e.target.value) setAu(e.target.value); }} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]" /></div>
              <div><label className="text-xs text-slate-400 block mb-1.5">Au</label><input type="date" value={au} onChange={(e) => setAu(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none [color-scheme:dark]" /></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div><label className="text-xs text-slate-400 block mb-1.5">Date *</label><input type="date" value={du} onChange={(e) => setDu(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-2 py-2 text-sm text-white focus:outline-none [color-scheme:dark]" /></div>
              <div><label className="text-xs text-slate-400 block mb-1.5">De</label><input type="time" step={1800} value={heureFrom} onChange={(e) => setHeureFrom(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-2 py-2 text-sm text-white focus:outline-none [color-scheme:dark]" /></div>
              <div><label className="text-xs text-slate-400 block mb-1.5">À</label><input type="time" step={1800} value={heureTo} onChange={(e) => setHeureTo(e.target.value)} className="w-full bg-slate-800 border border-white/10 rounded-xl px-2 py-2 text-sm text-white focus:outline-none [color-scheme:dark]" /></div>
            </div>
          )}
          <div>
            <label className="text-xs text-slate-400 block mb-1.5">Motif (optionnel)</label>
            <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Congés, formation…" className="w-full bg-slate-800 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-600 focus:outline-none" />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={saving} className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all">{saving ? "Enregistrement…" : "Bloquer"}</button>
            <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-all">Annuler</button>
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
  const [indispos, setIndispos]           = useState<CalIndispo[]>([]);
  const [typeFilter, setTypeFilter]       = useState({ interventions: true, rdv: true });
  const [selectedPersons, setSelectedPersons] = useState<Set<string> | null>(null); // null = toute l'équipe
  const [personMenu, setPersonMenu]       = useState(false);
  const [loading, setLoading]             = useState(true);
  const [dragId, setDragId]               = useState<string | null>(null);
  const dragRef = useRef<{ id: string; kind: "int" | "rdv"; grabPx: number; duree: number; origStart: number } | null>(null);
  const [nowY, setNowY]                   = useState<number | null>(null);
  const [modal, setModal]                 = useState<{ date: Date } | null>(null);
  const [indispoModal, setIndispoModal]   = useState(false);
  // Popup d'action au clic sur un évènement (ouvrir / supprimer).
  const [eventModal, setEventModal]       = useState<{ kind: "int" | "rdv" | "visite"; id: string; leadId?: string; title: string; sub: string; href: string } | null>(null);
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
      setIndispos(d.indispos ?? []);
    }
    setLoading(false);
  }, [viewMode, monthAnchor]);

  useEffect(() => { load(); }, [load]);

  // Suppression depuis la popup : intervention -> DELETE ; visite / RDV -> on efface la date du prospect.
  async function deleteEvent(ev: NonNullable<typeof eventModal>) {
    try {
      let res: Response;
      if (ev.kind === "int") {
        if (!confirm("Supprimer définitivement cette intervention ?")) return;
        res = await fetch(`/api/admin/interventions/${ev.id}`, { method: "DELETE" });
      } else {
        const patch = ev.kind === "visite" ? { visiteClientLe: null } : { rdvDate: null };
        res = await fetch(`/api/admin/leads`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ev.leadId, ...patch }) });
      }
      if (!res.ok) { alert("La suppression a échoué. Réessayez."); return; }
    } catch { alert("Erreur réseau, réessayez."); return; }
    setEventModal(null);
    load();
  }

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

  // Filtres : type (intervention / rdv) + personne. selectedPersons null = toute l'équipe.
  const knownIds = new Set(techniciens.map((t) => t.id));
  // Toute personne inconnue (ex. membre supprimé encore référencé) est rattachée à "Non assigné".
  const personKey = (id: string | null) => (id && knownIds.has(id) ? id : "__none__");
  const personMatch = (id: string | null) => selectedPersons === null || selectedPersons.has(personKey(id));
  const forDay = (d: Date) =>
    interventions.filter((i) => i.scheduledAt && isSameDay(new Date(i.scheduledAt), d) && i.status !== "annulée" && typeFilter.interventions && personMatch(i.technicienId));
  const forDayRdv = (d: Date) =>
    rdvs.filter((r) => r.rdvDate && isSameDay(new Date(r.rdvDate), d) && typeFilter.rdv && personMatch(r.commercialId));

  function togglePerson(id: string) {
    const allIds = [...techniciens.map((t) => t.id), "__none__"];
    const base = selectedPersons === null ? new Set(allIds) : new Set(selectedPersons);
    if (base.has(id)) base.delete(id); else base.add(id);
    setSelectedPersons(base.size === allIds.length ? null : base);
  }

  // ── Colonnes par chevauchement (façon agenda) ──────────────────────────────
  // On ne divise un créneau en sous-colonnes QUE si des évènements se chevauchent vraiment
  // dans le temps. Sinon, pleine largeur (plus lisible). La couleur de la personne sert de repère.
  const colorOf = (pid: string | null) => techniciens.find((t) => t.id === personKey(pid))?.color ?? null;
  const showPersonColor = selectedPersons === null || selectedPersons.size > 1;
  // Blocs d'indisponibilité (top/height) d'une personne un jour donné, bornés à la fenêtre horaire.
  function indispoBlocksFor(personId: string, day: Date): { top: number; height: number; motif: string | null }[] {
    const dayStart = new Date(day); dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day); dayEnd.setHours(23, 59, 59, 999);
    return indispos
      .filter((x) => x.technicienId === personId)
      .map((x) => ({ s: new Date(x.dateDebut), e: new Date(x.dateFin), motif: x.motif }))
      .filter((x) => x.s <= dayEnd && x.e >= dayStart)
      .map((x) => {
        const startH = x.s <= dayStart ? HOUR_START : x.s.getHours() + x.s.getMinutes() / 60;
        const endH   = x.e >= dayEnd   ? HOUR_END   : x.e.getHours() + x.e.getMinutes() / 60;
        const top    = Math.max(0, (Math.max(startH, HOUR_START) - HOUR_START) * PX_PER_HOUR);
        const bottom = Math.min((Math.min(endH, HOUR_END) - HOUR_START) * PX_PER_HOUR, TOTAL_HEIGHT);
        return { top, height: Math.max(0, bottom - top), motif: x.motif };
      })
      .filter((b) => b.height > 0);
  }

  // Bloc d'évènement positionné dans une colonne-jour.
  type DayBlock =
    | { k: "int"; key: string; top: number; height: number; ev: CalIntervention }
    | { k: "rdv"; key: string; top: number; height: number; rdv: CalRdv };
  type Placed = DayBlock & { col: number; cols: number };

  // Collision : les blocs qui se chevauchent dans le temps forment un groupe et se partagent
  // la largeur (col / cols). Les blocs isolés gardent toute la largeur (cols = 1).
  function layoutDay(blocks: DayBlock[]): Placed[] {
    const sorted = [...blocks].sort((a, b) => a.top - b.top || (a.top + a.height) - (b.top + b.height));
    const out: Placed[] = [];
    let cluster: Placed[] = [];
    let clusterEnd = -Infinity;
    const flush = () => {
      const cols = cluster.reduce((m, b) => Math.max(m, b.col + 1), 0);
      for (const b of cluster) { b.cols = cols; out.push(b); }
      cluster = [];
    };
    for (const b of sorted) {
      if (b.top >= clusterEnd) flush();
      const occupied = new Set(cluster.filter((x) => x.top + x.height > b.top).map((x) => x.col));
      let col = 0; while (occupied.has(col)) col++;
      cluster.push({ ...b, col, cols: 1 });
      clusterEnd = Math.max(clusterEnd, b.top + b.height);
    }
    flush();
    return out;
  }

  function dayBlocks(d: Date): Placed[] {
    const blocks: DayBlock[] = [];
    for (const ev of forDay(d)) {
      if (!ev.scheduledAt) continue;
      const top = topPx(new Date(ev.scheduledAt)); if (top > TOTAL_HEIGHT) continue;
      blocks.push({ k: "int", key: `i-${ev.id}`, top, height: heightPx(ev.duree ?? 60), ev });
    }
    for (const r of forDayRdv(d)) {
      if (!r.rdvDate) continue;
      const top = topPx(new Date(r.rdvDate)); if (top > TOTAL_HEIGHT) continue;
      blocks.push({ k: "rdv", key: `r-${r.id}`, top, height: heightPx(r.duree ?? 120), rdv: r });
    }
    return layoutDay(blocks);
  }

  // Position gauche/largeur selon la colonne de collision (pleine largeur si seul).
  function blockBox(col: number, cols: number) {
    if (cols <= 1) return { left: 4, right: 4 };
    const w = 100 / cols;
    return { left: `calc(${col * w}% + 2px)`, width: `calc(${w}% - 4px)` };
  }

  // ── Glisser-déposer pour déplacer un rendez-vous (comme le calendrier Apple) ──
  function onEventDragStart(e: React.DragEvent, id: string, kind: "int" | "rdv", duree: number, origStart: number) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragRef.current = { id, kind, grabPx: e.clientY - rect.top, duree, origStart };
    setDragId(id);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", id); } catch { /* ignore */ }
  }

  // personId : undefined = ne pas réassigner ; null = "Non assigné" ; sinon = nouvelle personne.
  async function applyMove(drag: NonNullable<typeof dragRef.current>, iso: string, personId?: string | null) {
    if (drag.kind === "int") {
      setInterventions((prev) => prev.map((i) => (i.id === drag.id ? { ...i, scheduledAt: iso, ...(personId !== undefined ? { technicienId: personId } : {}) } : i)));
      await fetch(`/api/admin/interventions/${drag.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "planifier", scheduledAt: iso, dureeEstimeeMinutes: drag.duree, ...(personId !== undefined ? { technicienId: personId } : {}) }),
      }).catch(() => {});
    } else {
      setRdvs((prev) => prev.map((r) => (r.id === drag.id ? { ...r, rdvDate: iso, ...(personId !== undefined ? { commercialId: personId } : {}) } : r)));
      await fetch(`/api/admin/leads`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: drag.id, rdvDate: iso, ...(personId !== undefined ? { commercialId: personId } : {}) }),
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

      {indispoModal && (
        <IndispoModal techniciens={techniciens} onClose={() => setIndispoModal(false)} onCreated={load} />
      )}

      {/* Popup d'action au clic sur un évènement : ouvrir la fiche ou supprimer */}
      {eventModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={() => setEventModal(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl w-full max-w-xs p-5" onClick={(e) => e.stopPropagation()}>
            <p className="text-white font-semibold text-sm">{eventModal.title}</p>
            <p className="text-slate-400 text-xs mt-0.5">{eventModal.sub}</p>
            <div className="mt-4 space-y-2">
              <Link href={eventModal.href} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors">
                <ExternalLink className="w-4 h-4" /> Ouvrir la fiche
              </Link>
              <button onClick={() => deleteEvent(eventModal)} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 text-sm font-semibold transition-colors">
                <Trash2 className="w-4 h-4" /> Supprimer
              </button>
              <button onClick={() => setEventModal(null)} className="w-full py-2 text-slate-400 hover:text-white text-sm transition-colors">Fermer</button>
            </div>
          </div>
        </div>
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

      {/* Filtres : type + personnes */}
      <div className="flex items-center flex-wrap gap-2 mb-3">
        <button onClick={() => setTypeFilter((t) => ({ ...t, interventions: !t.interventions }))}
          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${typeFilter.interventions ? "bg-sky-500/15 border-sky-500/40 text-sky-300" : "bg-slate-800 border-white/8 text-slate-500"}`}>
          Interventions
        </button>
        <button onClick={() => setTypeFilter((t) => ({ ...t, rdv: !t.rdv }))}
          className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors ${typeFilter.rdv ? "bg-amber-500/15 border-amber-500/40 text-amber-300" : "bg-slate-800 border-white/8 text-slate-500"}`}>
          RDV commerciaux
        </button>
        <div className="w-px h-5 bg-white/10 mx-1" />
        <div className="relative">
          <button onClick={() => setPersonMenu((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg border bg-slate-800 border-white/8 text-slate-300 hover:text-white transition-colors">
            {selectedPersons === null ? "Toute l'équipe" : `${selectedPersons.size} personne${selectedPersons.size > 1 ? "s" : ""}`}
            <ChevronDown className="w-3 h-3" />
          </button>
          {personMenu && (
            <div className="absolute z-30 left-0 mt-1 w-56 bg-[#0f1623] border border-white/10 rounded-xl shadow-xl p-2 max-h-72 overflow-y-auto">
              <div className="flex gap-1 mb-1.5">
                <button onClick={() => setSelectedPersons(null)} className="flex-1 text-[10px] py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white">Tous</button>
                <button onClick={() => setSelectedPersons(new Set())} className="flex-1 text-[10px] py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white">Aucun</button>
              </div>
              {techniciens.map((t) => {
                const checked = selectedPersons === null || selectedPersons.has(t.id);
                return (
                  <button key={t.id} onClick={() => togglePerson(t.id)} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left">
                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${checked ? "bg-sky-500 border-sky-500" : "border-white/20"}`}>
                      {checked && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.color ?? "#64748b" }} />
                    <span className="text-[11px] text-slate-200 flex-1 truncate">{t.name}</span>
                  </button>
                );
              })}
              <button onClick={() => togglePerson("__none__")} className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white/5 text-left">
                <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 ${(selectedPersons === null || selectedPersons.has("__none__")) ? "bg-sky-500 border-sky-500" : "border-white/20"}`}>
                  {(selectedPersons === null || selectedPersons.has("__none__")) && <Check className="w-2.5 h-2.5 text-white" />}
                </span>
                <span className="w-2 h-2 rounded-full bg-slate-500 flex-shrink-0" />
                <span className="text-[11px] text-slate-400 flex-1 truncate">Non assigné</span>
              </button>
            </div>
          )}
        </div>
        <button onClick={() => setIndispoModal(true)} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 transition-colors">
          <Ban className="w-3 h-3" /> Bloquer
        </button>
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
              const all: { kind: "int" | "rdv" | "visite"; id: string; leadId?: string; label: string; time: string; start: number; duree: number; type?: string }[] = [
                ...forDayRdv(d).map((r) => ({ kind: (r.kind ?? "rdv") as "rdv" | "visite", id: r.id, leadId: r.leadId ?? r.id, label: r.clientName, time: r.rdvDate ? fmtHM(new Date(r.rdvDate)) : "", start: r.rdvDate ? new Date(r.rdvDate).getTime() : 0, duree: r.duree ?? 120 })),
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
                          href={ev.kind === "int" ? `/admin/interventions/${ev.id}` : `/admin/leads?lead=${ev.leadId ?? ev.id}`}
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEventModal({ kind: ev.kind, id: ev.id, leadId: ev.leadId, title: ev.label, sub: `${ev.time ? ev.time + " · " : ""}${ev.kind === "int" ? "Intervention" : ev.kind === "visite" ? "Visite client" : "RDV commercial"}`, href: ev.kind === "int" ? `/admin/interventions/${ev.id}` : `/admin/leads?lead=${ev.leadId ?? ev.id}` }); }}
                          draggable={ev.kind !== "visite"}
                          onDragStart={(e) => { if (ev.kind === "visite") { e.preventDefault(); return; } onEventDragStart(e, ev.id, ev.kind as "int" | "rdv", ev.duree, ev.start); }}
                          onDragEnd={() => { dragRef.current = null; setDragId(null); }}
                          className={`block rounded px-1 py-0.5 text-[9px] leading-tight truncate hover:opacity-80 ${ev.kind === "visite" ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"} ${ev.kind === "rdv" ? "bg-amber-500/20 text-amber-300" : ev.kind === "visite" ? "bg-fuchsia-500/20 text-fuchsia-300" : `${cfg.bg} ${cfg.text}`} ${dragId === ev.id ? "opacity-40" : ""}`}>
                          {ev.time && <span className="opacity-70">{ev.time} </span>}{ev.kind === "rdv" ? "RDV " : ev.kind === "visite" ? "Visite " : ""}{ev.label}
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

                        {/* Indisponibilités : fond grisé pleine largeur (n'impacte pas le découpage des évènements) */}
                        {indispos.filter((x) => personMatch(x.technicienId)).flatMap((x) =>
                          indispoBlocksFor(x.technicienId, d).map((b, bi) => (
                            <div key={`g-${x.technicienId}-${bi}`} className="absolute left-0 right-0 z-0 pointer-events-none border-y border-white/5"
                              style={{ top: b.top, height: b.height, backgroundColor: "rgba(15,23,42,0.55)", backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(255,255,255,0.05) 5px, rgba(255,255,255,0.05) 10px)" }}>
                              {b.height > 22 && <span className="absolute top-0.5 left-1 text-[8px] font-medium text-slate-400 truncate pr-1">{b.motif || "Indispo"}</span>}
                            </div>
                          ))
                        )}

                        {/* Interventions + RDV : divisés en colonnes UNIQUEMENT en cas de chevauchement réel */}
                        {dayBlocks(d).map((b) => {
                          const box = blockBox(b.col, b.cols);
                          if (b.k === "rdv") {
                            const r = b.rdv;
                            const start = new Date(r.rdvDate!);
                            const pc = showPersonColor ? colorOf(r.commercialId) : null;
                            const isVisite = r.kind === "visite";
                            return (
                              <Link
                                key={b.key}
                                href={`/admin/leads?lead=${r.leadId ?? r.id}`}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEventModal({ kind: isVisite ? "visite" : "rdv", id: r.id, leadId: r.leadId ?? r.id, title: r.clientName, sub: `${fmtHM(start)} · ${isVisite ? "Visite client" : "RDV commercial"}${r.commercialName ? ` · ${r.commercialName}` : ""}`, href: `/admin/leads?lead=${r.leadId ?? r.id}` }); }}
                                draggable={!isVisite}
                                onDragStart={(e) => { if (isVisite) { e.preventDefault(); return; } onEventDragStart(e, r.id, "rdv", r.duree ?? 120, start.getTime()); }}
                                onDragEnd={() => { dragRef.current = null; setDragId(null); }}
                                className={`absolute rounded-lg border px-2 py-1 overflow-hidden z-10 transition-opacity hover:opacity-80 ${isVisite ? "cursor-pointer bg-fuchsia-500/15 border-fuchsia-500/40" : "cursor-grab active:cursor-grabbing bg-amber-500/15 border-amber-500/40"} ${dragId === r.id ? "opacity-40" : ""}`}
                                style={{ top: b.top, height: b.height, ...box, ...(pc ? { borderLeftColor: pc, borderLeftWidth: 3 } : {}) }}
                              >
                                <div className="flex items-start gap-1.5 h-full overflow-hidden">
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[3px] ${isVisite ? "bg-fuchsia-400" : "bg-amber-400"}`} />
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-[10px] font-semibold leading-tight truncate ${isVisite ? "text-fuchsia-300" : "text-amber-300"}`}>{fmtHM(start)} · {r.clientName || (isVisite ? "Visite" : "RDV")}</p>
                                    {b.height >= 34 && <p className="text-white/70 text-[10px] leading-tight truncate mt-0.5">{isVisite ? "Visite" : "RDV"}{r.commercialName ? ` · ${r.commercialName}` : ""}</p>}
                                  </div>
                                </div>
                              </Link>
                            );
                          }
                          const ev = b.ev;
                          const start = new Date(ev.scheduledAt!);
                          const dur = ev.duree ?? 60;
                          const c = TYPE_COLORS[ev.type] ?? TYPE_COLORS.autre;
                          const isShort = b.height < 44;
                          const pc = showPersonColor ? colorOf(ev.technicienId) : null;
                          return (
                            <Link
                              key={b.key}
                              href={`/admin/interventions/${ev.id}`}
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEventModal({ kind: "int", id: ev.id, title: ev.clientName, sub: `${fmtHM(start)} · ${ev.type}`, href: `/admin/interventions/${ev.id}` }); }}
                              draggable
                              onDragStart={(e) => onEventDragStart(e, ev.id, "int", dur, start.getTime())}
                              onDragEnd={() => { dragRef.current = null; setDragId(null); }}
                              className={`absolute rounded-lg border px-2 py-1 overflow-hidden z-10 transition-opacity hover:opacity-80 cursor-grab active:cursor-grabbing ${c.bg} ${c.border} ${dragId === ev.id ? "opacity-40" : ""}`}
                              style={{ top: b.top, height: b.height, ...box, ...(pc ? { borderLeftColor: pc, borderLeftWidth: 3 } : {}) }}
                            >
                              <div className="flex items-start gap-1.5 h-full overflow-hidden">
                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-[3px] ${c.dot}`} />
                                <div className="flex-1 min-w-0">
                                  {isShort ? (
                                    <p className={`text-[10px] font-semibold leading-tight truncate ${c.text}`}>{fmtHM(start)} · {ev.clientName}</p>
                                  ) : (
                                    <>
                                      <p className={`text-[10px] font-semibold leading-tight ${c.text}`}>{fmtHM(start)}{dur !== 60 ? ` · ${dur < 60 ? dur + "min" : dur / 60 + "h"}` : ""}</p>
                                      <p className="text-white/85 text-[11px] font-medium leading-tight truncate mt-0.5">{ev.clientName}</p>
                                      <p className={`text-[10px] leading-tight truncate opacity-70 ${c.text}`}>{TYPE_LABELS[ev.type] ?? ev.type}{ev.technicienName ? ` · ${ev.technicienName}` : ""}</p>
                                    </>
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
