"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Calendar, AlertTriangle, Wrench } from "lucide-react";

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

type CalIntervention = {
  id: string; type: string; status: string; scheduledAt: string | null;
  address: string | null; technicienId: string | null; duree: number | null;
  clientName: string; technicienName: string | null;
};
type CalTechnicien = { id: string; name: string; color: string | null };
type CalPeriode    = { id: string; nom: string; dateDebut: string; dateFin: string; maxInterventionsSemaine: number; note: string | null };

function getMondayOf(d: Date) {
  const day = new Date(d);
  const dow = day.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  day.setDate(day.getDate() + diff);
  day.setHours(0, 0, 0, 0);
  return day;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function overlapsPeriode(weekStart: Date, weekEnd: Date, p: CalPeriode) {
  const ps = new Date(p.dateDebut + "T00:00:00");
  const pe = new Date(p.dateFin   + "T23:59:59");
  return ps <= weekEnd && pe >= weekStart;
}

export default function CalendrierAdmin() {
  const [weekStart, setWeekStart] = useState(() => getMondayOf(new Date()));
  const [techFilter, setTechFilter] = useState<string>("all");
  const [interventions, setInterventions] = useState<CalIntervention[]>([]);
  const [techniciens, setTechniciens] = useState<CalTechnicien[]>([]);
  const [periodes, setPeriodes] = useState<CalPeriode[]>([]);
  const [loading, setLoading] = useState(true);

  const weekEnd = addDays(weekStart, 6);

  const load = useCallback(async () => {
    setLoading(true);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const res = await fetch(`/api/admin/calendrier?start=${fmt(weekStart)}&end=${fmt(weekEnd)}`);
    if (res.ok) {
      const data = await res.json();
      setInterventions(data.interventions);
      setTechniciens(data.techniciens);
      setPeriodes(data.periodes);
    }
    setLoading(false);
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const activePeriodes = periodes.filter((p) => overlapsPeriode(weekStart, weekEnd, p));

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const today = new Date();

  const filtered = interventions.filter(
    (i) => i.status !== "annulée" && (techFilter === "all" || i.technicienId === techFilter),
  );

  const forDay = (d: Date) =>
    filtered.filter((i) => i.scheduledAt && isSameDay(new Date(i.scheduledAt), d));

  const totalThisWeek = filtered.length;

  const fmt = (d: Date) => `${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart(addDays(weekStart, -7))}
            className="p-1.5 rounded-lg bg-slate-800 border border-white/8 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-white min-w-[160px] text-center">
            {fmt(weekStart)} – {fmt(weekEnd)}
          </span>
          <button
            onClick={() => setWeekStart(addDays(weekStart, 7))}
            className="p-1.5 rounded-lg bg-slate-800 border border-white/8 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setWeekStart(getMondayOf(new Date()))}
            className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 border border-white/8 text-slate-400 hover:text-white transition-colors"
          >
            Aujourd&apos;hui
          </button>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">{totalThisWeek} intervention{totalThisWeek !== 1 ? "s" : ""} cette semaine</span>
          <select
            value={techFilter}
            onChange={(e) => setTechFilter(e.target.value)}
            className="text-xs bg-slate-800 border border-white/8 text-slate-300 rounded-xl px-3 py-1.5 focus:outline-none"
          >
            <option value="all">Tous les techniciens</option>
            {techniciens.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Saisonnalité banner */}
      {activePeriodes.map((p) => (
        <div key={p.id} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-300 text-sm font-semibold">{p.nom}</p>
            <p className="text-amber-400/70 text-xs">
              Max {p.maxInterventionsSemaine} interventions/semaine · {totalThisWeek >= p.maxInterventionsSemaine
                ? <span className="text-red-400 font-semibold">Capacité atteinte ({totalThisWeek}/{p.maxInterventionsSemaine})</span>
                : <span>{totalThisWeek}/{p.maxInterventionsSemaine} planifiées</span>}
              {p.note && ` · ${p.note}`}
            </p>
          </div>
        </div>
      ))}

      {/* Calendar grid */}
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-2">
          {days.map((d, idx) => {
            const isToday = isSameDay(d, today);
            const dayItems = forDay(d);
            return (
              <div key={idx} className={`min-h-[160px] rounded-2xl border ${isToday ? "border-sky-500/50 bg-sky-500/5" : "border-white/8 bg-slate-800/30"} flex flex-col`}>
                <div className={`px-2 py-2 text-center border-b ${isToday ? "border-sky-500/30" : "border-white/5"}`}>
                  <p className="text-[10px] text-slate-500 font-medium">{DAYS_FR[idx]}</p>
                  <p className={`text-sm font-bold ${isToday ? "text-sky-400" : "text-slate-300"}`}>{d.getDate()}</p>
                  {dayItems.length > 0 && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-400">{dayItems.length}</span>
                  )}
                </div>
                <div className="flex-1 p-1.5 space-y-1 overflow-y-auto">
                  {dayItems.map((i) => (
                    <Link
                      key={i.id}
                      href={`/admin/interventions/${i.id}`}
                      className={`block rounded-lg border px-2 py-1.5 text-[10px] leading-tight hover:opacity-80 transition-opacity ${TYPE_BG[i.type] ?? TYPE_BG.autre}`}
                    >
                      <div className="flex items-center gap-1 mb-0.5">
                        <Wrench className="w-2.5 h-2.5 flex-shrink-0" />
                        <span className="font-semibold truncate">{TYPE_LABELS[i.type] ?? i.type}</span>
                      </div>
                      <p className="truncate text-white/70">{i.clientName}</p>
                      {i.technicienName && (
                        <p className="truncate opacity-60">{i.technicienName}</p>
                      )}
                      {i.scheduledAt && (
                        <p className="opacity-50">
                          {new Date(i.scheduledAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          {i.duree ? ` · ${i.duree}min` : ""}
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
        <Link href="/admin/saisonnalite" className="flex items-center gap-1.5 text-[10px] text-slate-500 hover:text-amber-400 ml-auto transition-colors">
          <Calendar className="w-3 h-3" /> Gérer la saisonnalité
        </Link>
      </div>
    </div>
  );
}
