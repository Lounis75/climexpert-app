"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, AlertTriangle, Wrench, UserCheck } from "lucide-react";

const TYPE_BG: Record<string, string> = {
  installation:  "bg-sky-500/20 border-sky-500/40 text-sky-300",
  entretien:     "bg-emerald-500/20 border-emerald-500/40 text-emerald-300",
  depannage:     "bg-red-500/20 border-red-500/40 text-red-300",
  "contrat-pro": "bg-violet-500/20 border-violet-500/40 text-violet-300",
  autre:         "bg-slate-500/20 border-slate-500/40 text-slate-300",
};

const TYPE_LABELS: Record<string, string> = {
  installation: "Install.", entretien: "Entret.", depannage: "Dépann.",
  "contrat-pro": "Contrat", autre: "Autre",
};

const DAYS_FR = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS_FR = ["jan", "fév", "mar", "avr", "mai", "jun", "jul", "aoû", "sep", "oct", "nov", "déc"];
const MONTHS_FR_LONG = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

type CalIntervention = {
  id: string; type: string; status: string; scheduledAt: string | null;
  address: string | null; technicienId: string | null; duree: number | null;
  confirmation: string | null; clientName: string; technicienName: string | null;
};
type CalTechnicien = { id: string; name: string; color: string | null };
type CalPeriode    = { id: string; nom: string; dateDebut: string; dateFin: string; maxInterventionsSemaine: number; note: string | null };
type CalRdv        = { id: string; clientName: string; rdvDate: string | null };

function getMondayOf(d: Date) {
  const day = new Date(d);
  const dow = day.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  day.setDate(day.getDate() + diff);
  day.setHours(0, 0, 0, 0);
  return day;
}

function addDays(d: Date, n: number) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function addMonths(d: Date, n: number) { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; }
function startOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth(), 1); }
function endOfMonth(d: Date) { return new Date(d.getFullYear(), d.getMonth() + 1, 0); }
function monthGridStart(d: Date) { return getMondayOf(startOfMonth(d)); }
function monthGridEnd(d: Date) { return addDays(getMondayOf(endOfMonth(d)), 6); }

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function overlapsPeriode(start: Date, end: Date, p: CalPeriode) {
  const ps = new Date(p.dateDebut + "T00:00:00");
  const pe = new Date(p.dateFin   + "T23:59:59");
  return ps <= end && pe >= start;
}

function hm(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export default function CalendrierAdmin() {
  const [viewMode, setViewMode] = useState<"semaine" | "mois">("semaine");
  const [cursor, setCursor] = useState(() => new Date());
  const [techFilter, setTechFilter] = useState<string>("all");
  const [interventions, setInterventions] = useState<CalIntervention[]>([]);
  const [techniciens, setTechniciens] = useState<CalTechnicien[]>([]);
  const [periodes, setPeriodes] = useState<CalPeriode[]>([]);
  const [rdvs, setRdvs] = useState<CalRdv[]>([]);
  const [loading, setLoading] = useState(true);

  const isMonth = viewMode === "mois";
  const periodStart = isMonth ? monthGridStart(cursor) : getMondayOf(cursor);
  const periodEnd   = isMonth ? monthGridEnd(cursor)   : addDays(getMondayOf(cursor), 6);

  const load = useCallback(async () => {
    setLoading(true);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const res = await fetch(`/api/admin/calendrier?start=${fmt(periodStart)}&end=${fmt(periodEnd)}`);
    if (res.ok) {
      const data = await res.json();
      setInterventions(data.interventions);
      setTechniciens(data.techniciens);
      setPeriodes(data.periodes);
      setRdvs(data.rdvs ?? []);
    }
    setLoading(false);
  }, [viewMode, cursor]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const today = new Date();
  const activePeriodes = periodes.filter((p) => overlapsPeriode(periodStart, periodEnd, p));

  const filtered = interventions.filter(
    (i) => i.status !== "annulée" && (techFilter === "all" || i.technicienId === techFilter),
  );

  const forDay = (d: Date) =>
    filtered.filter((i) => i.scheduledAt && isSameDay(new Date(i.scheduledAt), d));
  const forDayRdv = (d: Date) =>
    rdvs.filter((r) => r.rdvDate && isSameDay(new Date(r.rdvDate), d));

  const total = filtered.length;

  function prev() { setCursor(isMonth ? addMonths(cursor, -1) : addDays(cursor, -7)); }
  function next() { setCursor(isMonth ? addMonths(cursor, 1) : addDays(cursor, 7)); }

  const fmt = (d: Date) => `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
  const periodLabel = isMonth
    ? `${MONTHS_FR_LONG[cursor.getMonth()]} ${cursor.getFullYear()}`
    : `${fmt(periodStart)} – ${fmt(periodEnd)}`;

  const weekDays  = Array.from({ length: 7 },  (_, i) => addDays(periodStart, i));
  const monthDays = Array.from({ length: Math.round((periodEnd.getTime() - periodStart.getTime()) / 86400000) + 1 }, (_, i) => addDays(periodStart, i));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prev} className="p-1.5 rounded-lg bg-slate-800 border border-white/8 text-slate-400 hover:text-white transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-white min-w-[170px] text-center capitalize">{periodLabel}</span>
          <button onClick={next} className="p-1.5 rounded-lg bg-slate-800 border border-white/8 text-slate-400 hover:text-white transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
          <button onClick={() => setCursor(new Date())} className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-white/8 text-slate-400 hover:text-white transition-colors">
            Aujourd&apos;hui
          </button>
        </div>
        <div className="flex items-center gap-3">
          {/* Bascule Semaine / Mois */}
          <div className="flex items-center rounded-xl bg-slate-800 border border-white/8 p-0.5">
            {(["semaine", "mois"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 text-xs font-medium rounded-lg capitalize transition-colors ${
                  viewMode === m ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <span className="text-xs text-slate-500">{total} intervention{total !== 1 ? "s" : ""}</span>
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="text-xs bg-slate-800 border border-white/8 text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="all">Tous les techniciens</option>
            {techniciens.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Saisonnalité (vue semaine uniquement) */}
      {!isMonth && activePeriodes.map((p) => (
        <div key={p.id} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-sm font-semibold">{p.nom}</p>
            <p className="text-amber-400/70 text-xs">
              Max {p.maxInterventionsSemaine} interventions/semaine · {total >= p.maxInterventionsSemaine
                ? <span className="text-red-400 font-semibold">Capacité atteinte ({total}/{p.maxInterventionsSemaine})</span>
                : <span>{total}/{p.maxInterventionsSemaine} planifiées</span>}
              {p.note && ` · ${p.note}`}
            </p>
          </div>
        </div>
      ))}

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : isMonth ? (
        /* ── Vue MOIS ──────────────────────────────────────────────────── */
        <div>
          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {DAYS_FR.map((d) => (
              <p key={d} className="text-[10px] text-slate-500 font-medium text-center">{d}</p>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {monthDays.map((d, idx) => {
              const inMonth = d.getMonth() === cursor.getMonth();
              const isToday = isSameDay(d, today);
              const dayItems = forDay(d);
              const dayRdvs = forDayRdv(d);
              const all = [
                ...dayRdvs.map((r) => ({ kind: "rdv" as const, id: r.id, label: r.clientName, time: r.rdvDate ? hm(r.rdvDate) : "" })),
                ...dayItems.map((i) => ({ kind: "int" as const, id: i.id, label: i.clientName, time: i.scheduledAt ? hm(i.scheduledAt) : "", type: i.type })),
              ];
              return (
                <div
                  key={idx}
                  className={`min-h-[92px] rounded-xl border p-1.5 flex flex-col ${
                    isToday ? "border-sky-500/50 bg-sky-500/5" : "border-white/8 bg-slate-800/30"
                  } ${inMonth ? "" : "opacity-40"}`}
                >
                  <p className={`text-[11px] font-bold mb-1 ${isToday ? "text-sky-400" : "text-slate-400"}`}>{d.getDate()}</p>
                  <div className="space-y-0.5 overflow-hidden">
                    {all.slice(0, 3).map((e) => (
                      <Link
                        key={`${e.kind}-${e.id}`}
                        href={e.kind === "rdv" ? `/admin/leads?lead=${e.id}` : `/admin/interventions/${e.id}`}
                        className={`block rounded px-1 py-0.5 text-[9px] leading-tight truncate hover:opacity-80 ${
                          e.kind === "rdv" ? "bg-amber-500/20 text-amber-300" : (TYPE_BG[(e as { type: string }).type] ?? TYPE_BG.autre)
                        }`}
                      >
                        {e.time && <span className="opacity-70">{e.time} </span>}{e.kind === "rdv" ? "RDV " : ""}{e.label}
                      </Link>
                    ))}
                    {all.length > 3 && <p className="text-[9px] text-slate-500 px-1">+{all.length - 3}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Vue SEMAINE ───────────────────────────────────────────────── */
        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((d, idx) => {
            const isToday = isSameDay(d, today);
            const dayItems = forDay(d);
            const dayRdvs = forDayRdv(d);
            return (
              <div key={idx} className={`min-h-[160px] rounded-2xl border ${isToday ? "border-sky-500/50 bg-sky-500/5" : "border-white/8 bg-slate-800/30"} flex flex-col`}>
                <div className={`px-2 py-2 text-center border-b ${isToday ? "border-sky-500/30" : "border-white/5"}`}>
                  <p className="text-[10px] text-slate-500 font-medium">{DAYS_FR[idx]}</p>
                  <p className={`text-sm font-bold ${isToday ? "text-sky-400" : "text-slate-300"}`}>{d.getDate()}</p>
                  {(dayItems.length + dayRdvs.length) > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400">{dayItems.length + dayRdvs.length}</span>
                  )}
                </div>
                <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
                  {/* RDV commerciaux (prospects) */}
                  {dayRdvs.map((r) => (
                    <Link
                      key={r.id}
                      href={`/admin/leads?lead=${r.id}`}
                      className="block rounded-lg border px-2 py-1.5 text-[10px] leading-tight hover:opacity-80 transition-opacity bg-amber-500/20 border-amber-500/40 text-amber-300"
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <UserCheck className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="font-semibold truncate">RDV</span>
                      </div>
                      <p className="truncate text-white/70">{r.clientName}</p>
                      {r.rdvDate && <p className="opacity-50">{hm(r.rdvDate)}</p>}
                    </Link>
                  ))}
                  {dayItems.map((i) => (
                    <Link
                      key={i.id}
                      href={`/admin/interventions/${i.id}`}
                      className={`block rounded-lg border px-2 py-1.5 text-[10px] leading-tight hover:opacity-80 transition-opacity ${TYPE_BG[i.type] ?? TYPE_BG.autre}`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <Wrench className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="font-semibold truncate">{TYPE_LABELS[i.type] ?? i.type}</span>
                        {i.confirmation === "confirme" && <span title="Confirmé par le client" className="ml-auto flex-shrink-0 w-2 h-2 rounded-full bg-emerald-400" />}
                        {i.confirmation === "probleme" && <span title="Problème signalé par le client" className="ml-auto flex-shrink-0 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                      </div>
                      <p className="truncate text-white/70">{i.clientName}</p>
                      {i.technicienName && <p className="truncate opacity-60">{i.technicienName}</p>}
                      {i.scheduledAt && (
                        <p className="opacity-50">
                          {hm(i.scheduledAt)}{i.duree ? ` · ${i.duree}min` : ""}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap pt-1">
        {Object.entries(TYPE_BG).map(([type, cls]) => (
          <div key={type} className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border ${cls}`}>
            <Wrench className="w-2.5 h-2.5" />
            {TYPE_LABELS[type] ?? type}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-lg border bg-amber-500/20 border-amber-500/40 text-amber-300">
          <UserCheck className="w-2.5 h-2.5" /> RDV prospect
        </div>
      </div>
    </div>
  );
}
