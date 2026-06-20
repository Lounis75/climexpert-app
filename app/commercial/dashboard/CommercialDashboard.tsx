"use client";

import { useEffect, useState } from "react";
import { Phone, MapPin, Briefcase, LogOut, RefreshCw, User, Clock, Handshake, CalendarClock } from "lucide-react";
import type { CommercialSession } from "@/lib/auth";

export type RdvItem = {
  id: string;
  name: string;
  phone: string;
  project: string | null;
  location: string | null;
  rdvDate: string | null;
};

type Lead = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  location: string | null;
  project: string | null;
  status: string;
  message: string | null;
  notes: string | null;
  createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  nouveau:      "bg-sky-100 text-sky-700",
  "contacté":   "bg-amber-100 text-amber-700",
  devis_envoyé: "bg-violet-100 text-violet-700",
  "gagné":      "bg-emerald-100 text-emerald-700",
  perdu:        "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  nouveau:      "Nouveau",
  "contacté":   "Contacté",
  devis_envoyé: "Devis envoyé",
  "gagné":      "Gagné",
  perdu:        "Perdu",
};

const PROJECT_LABELS: Record<string, string> = {
  installation:  "Installation",
  entretien:     "Entretien",
  depannage:     "Dépannage",
  "contrat-pro": "Contrat pro",
  autre:         "Autre",
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 1)  return "à l'instant";
  if (m < 60) return `il y a ${m}m`;
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${days}j`;
}

const rdvDay = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const rdvTime = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

export default function CommercialDashboard({ session, rdvs }: { session: CommercialSession; rdvs: RdvItem[] }) {
  const [leads, setLeads]       = useState<Lead[]>([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [notes, setNotes]       = useState("");
  const [saving, setSaving]     = useState(false);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch("/api/commercial/leads");
      const data = await res.json();
      setLeads(data.leads ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchLeads(); }, []);

  function openLead(lead: Lead) {
    setSelected(lead);
    setNotes(lead.notes ?? "");
  }

  async function saveNotes() {
    if (!selected) return;
    setSaving(true);
    try {
      const res = await fetch("/api/commercial/leads", {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ id: selected.id, notes }),
      });
      const data = await res.json();
      if (data.lead) {
        setLeads(prev => prev.map(l => l.id === selected.id ? { ...l, notes } : l));
        setSelected(prev => prev ? { ...prev, notes } : null);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/commercial/verify", { method: "DELETE" });
    window.location.href = "/commercial/login";
  }

  const stats = {
    total:   leads.length,
    nouveau: leads.filter(l => l.status === "nouveau").length,
    gagne:   leads.filter(l => l.status === "gagné").length,
  };

  // Mes rendez-vous à venir (aujourd'hui et après), du plus proche au plus lointain.
  const rdvTodayStart = new Date(); rdvTodayStart.setHours(0, 0, 0, 0);
  const upcomingRdvs = rdvs
    .filter((r) => r.rdvDate && new Date(r.rdvDate) >= rdvTodayStart)
    .sort((a, b) => new Date(a.rdvDate!).getTime() - new Date(b.rdvDate!).getTime());

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-violet-500 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-semibold text-sm">
              Clim<span className="text-violet-400">Expert</span>
              <span className="text-slate-500 font-normal ml-1.5 hidden sm:inline">/ Commercial</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400 text-xs hidden sm:block">{session.name}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors">
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Mes leads", value: stats.total, color: "text-white" },
            { label: "Nouveaux", value: stats.nouveau, color: "text-sky-400" },
            { label: "Gagnés",   value: stats.gagne,   color: "text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-slate-800 border border-white/10 rounded-2xl p-5 text-center">
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Mes rendez-vous (RDV pris liés à ce commercial) */}
        <div className="mb-8">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <Handshake className="w-4 h-4 text-fuchsia-400" /> Mes rendez-vous
            <span className="text-fuchsia-400 text-xs font-bold bg-fuchsia-500/15 px-2 py-0.5 rounded-full">{upcomingRdvs.length}</span>
          </h2>
          {upcomingRdvs.length === 0 ? (
            <div className="bg-slate-800 border border-white/10 rounded-2xl p-8 text-center">
              <CalendarClock className="w-8 h-8 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">Aucun rendez-vous à venir.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {upcomingRdvs.map((r) => (
                <div key={r.id} className="bg-slate-800 border border-white/10 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-14 flex-shrink-0 text-center">
                    <p className="text-fuchsia-400 text-[10px] font-bold uppercase leading-tight">{r.rdvDate ? rdvDay(r.rdvDate) : "—"}</p>
                    <p className="text-white text-lg font-bold tabular-nums leading-none mt-0.5">{r.rdvDate ? rdvTime(r.rdvDate) : "--:--"}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{r.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                      {r.project && <span>{PROJECT_LABELS[r.project] ?? r.project}</span>}
                      {r.location && <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 flex-shrink-0" />{r.location}</span>}
                    </div>
                  </div>
                  <a href={`tel:${r.phone}`} className="w-11 h-11 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 flex items-center justify-center flex-shrink-0 active:bg-violet-500/25 transition-colors" title="Appeler">
                    <Phone className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* List + Detail */}
        <div className={`grid gap-6 ${selected ? "lg:grid-cols-2" : "grid-cols-1"}`}>
          {/* Lead list */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-semibold">Mes leads assignés</h2>
              <button onClick={fetchLeads} className="text-slate-400 hover:text-white transition-colors">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-slate-800 border border-white/10 rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-slate-700 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-slate-700 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="bg-slate-800 border border-white/10 rounded-2xl p-10 text-center">
                <User className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Aucun lead assigné pour l'instant.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {leads.map(lead => (
                  <button
                    key={lead.id}
                    onClick={() => openLead(lead)}
                    className={`w-full text-left bg-slate-800 border rounded-xl p-4 hover:border-violet-500/40 transition-all ${
                      selected?.id === lead.id ? "border-violet-500 bg-violet-500/10" : "border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-sm text-white truncate">{lead.name}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLORS[lead.status] ?? "bg-slate-700 text-slate-300"}`}>
                            {STATUS_LABELS[lead.status] ?? lead.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs">{lead.phone}</p>
                        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
                          {lead.project && <span>{PROJECT_LABELS[lead.project] ?? lead.project}</span>}
                          {lead.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{lead.location}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-600 flex-shrink-0 flex items-center gap-1">
                        <Clock className="w-3 h-3" />{timeAgo(lead.createdAt)}
                      </span>
                    </div>
                    {lead.notes && (
                      <p className="text-xs text-slate-500 mt-2 border-t border-white/5 pt-2 truncate">
                        📝 {lead.notes}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Detail panel */}
          {selected && (
            <div className="bg-slate-800 border border-white/10 rounded-2xl overflow-hidden sticky top-20 self-start">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                <p className="text-white font-semibold text-sm">{selected.name}</p>
                <button onClick={() => setSelected(null)} className="text-slate-500 hover:text-white text-lg leading-none">×</button>
              </div>

              <div className="p-5 space-y-4">
                {/* Contact */}
                <a href={`tel:${selected.phone}`} className="flex items-center gap-3 p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl hover:bg-violet-500/20 transition-colors">
                  <Phone className="w-4 h-4 text-violet-400 flex-shrink-0" />
                  <div>
                    <p className="text-violet-300 text-xs font-medium">Appuyer pour appeler</p>
                    <p className="text-white font-bold">{selected.phone}</p>
                  </div>
                </a>

                {/* Infos */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-700/50 rounded-xl p-3">
                    <p className="text-slate-400 text-xs mb-1">Projet</p>
                    <p className="text-white text-sm font-medium">{PROJECT_LABELS[selected.project ?? ""] ?? selected.project ?? "—"}</p>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-3">
                    <p className="text-slate-400 text-xs mb-1">Localisation</p>
                    <p className="text-white text-sm font-medium truncate">{selected.location ?? "—"}</p>
                  </div>
                  {selected.email && (
                    <div className="col-span-2 bg-slate-700/50 rounded-xl p-3">
                      <p className="text-slate-400 text-xs mb-1">Email</p>
                      <p className="text-white text-sm">{selected.email}</p>
                    </div>
                  )}
                  <div className="col-span-2 bg-slate-700/50 rounded-xl p-3">
                    <p className="text-slate-400 text-xs mb-1">Statut</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status] ?? ""}`}>
                      {STATUS_LABELS[selected.status] ?? selected.status}
                    </span>
                  </div>
                </div>

                {/* Message client */}
                {selected.message && (
                  <div className="bg-slate-700/50 rounded-xl p-3">
                    <p className="text-slate-400 text-xs mb-1">Message du client</p>
                    <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                  </div>
                )}

                {/* Note interne */}
                <div>
                  <label className="block text-slate-400 text-xs mb-1.5">Note interne</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Ajouter une note…"
                    className="w-full bg-slate-700 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
                  />
                  <button
                    onClick={saveNotes} disabled={saving}
                    className="mt-2 w-full py-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
                  >
                    {saving ? "Enregistrement…" : "Sauvegarder la note"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
