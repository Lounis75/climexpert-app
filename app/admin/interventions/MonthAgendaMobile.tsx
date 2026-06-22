"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { EventCard, type PlanningEvent } from "./AgendaMobile";

const DOW = ["L", "M", "M", "J", "V", "S", "D"];
const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// Pastille de couleur selon le type d'événement (cohérent avec la barre des cartes).
const DOT: Record<string, string> = {
  installation: "bg-sky-400", entretien: "bg-emerald-400", depannage: "bg-red-400",
  "contrat-pro": "bg-violet-400", autre: "bg-slate-400",
};
const dotColor = (e: PlanningEvent) => (e.kind === "rdv" ? "bg-fuchsia-400" : (DOT[e.category] ?? "bg-slate-400"));

// Grille de 6 semaines (lundi → dimanche) couvrant le mois de `monthFirst`.
function getMonthGrid(monthFirst: Date): Date[] {
  const first = new Date(monthFirst.getFullYear(), monthFirst.getMonth(), 1);
  const offset = (first.getDay() + 6) % 7; // 0 = lundi
  const cur = new Date(first);
  cur.setDate(first.getDate() - offset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  return days;
}

export default function MonthAgendaMobile({
  events, newHref, newLabel,
}: {
  events: PlanningEvent[];
  newHref?: string;
  newLabel?: string;
}) {
  const today = startOfDay(new Date());
  const todayKey = dayKey(today);
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selected, setSelected] = useState<Date>(today);

  const byDay = useMemo(() => {
    const m = new Map<string, PlanningEvent[]>();
    for (const e of events) {
      if (!e.start) continue;
      const k = dayKey(startOfDay(new Date(e.start)));
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(e);
    }
    for (const arr of m.values()) arr.sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime());
    return m;
  }, [events]);

  const days = useMemo(() => getMonthGrid(cursor), [cursor]);
  const selKey = dayKey(selected);
  const selEvents = byDay.get(selKey) ?? [];

  function goToday() {
    setCursor(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(today);
  }

  return (
    <div>
      {/* En-tête mois + navigation */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-semibold capitalize text-base">
          {cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </span>
        <div className="flex items-center gap-1">
          <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 active:bg-white/10" aria-label="Mois précédent">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={goToday} className="text-sky-400 text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-sky-500/10 active:bg-sky-500/20">
            Aujourd&apos;hui
          </button>
          <button onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 active:bg-white/10" aria-label="Mois suivant">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Jours de la semaine */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DOW.map((d, i) => <div key={i} className="text-center text-[10px] text-slate-500 font-medium py-1">{d}</div>)}
      </div>

      {/* Grille du mois */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const k = dayKey(day);
          const inMonth = day.getMonth() === cursor.getMonth();
          const isToday = k === todayKey;
          const isSel = k === selKey;
          const dayEvents = byDay.get(k) ?? [];
          return (
            <button key={k} onClick={() => setSelected(startOfDay(day))}
              className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 border transition-colors ${
                isSel ? "bg-sky-500/20 border-sky-500/50" : "border-transparent active:bg-white/5"
              } ${!inMonth ? "opacity-30" : ""}`}>
              <span className={`text-sm tabular-nums leading-none ${
                isToday ? "text-sky-400 font-bold" : isSel ? "text-white font-semibold" : "text-slate-200"
              }`}>{day.getDate()}</span>
              <div className="flex gap-0.5 h-1">
                {dayEvents.slice(0, 3).map((e, i) => <span key={i} className={`w-1 h-1 rounded-full ${dotColor(e)}`} />)}
              </div>
            </button>
          );
        })}
      </div>

      {/* Jour sélectionné + ses événements */}
      <div className="mt-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-white capitalize">
            {selected.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
          </span>
          {selEvents.length > 0 && (
            <span className="text-[10px] text-slate-500">{selEvents.length} élément{selEvents.length > 1 ? "s" : ""}</span>
          )}
        </div>
        {selEvents.length === 0 ? (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-8 text-center">
            <p className="text-slate-500 text-sm">Rien de prévu ce jour.</p>
            {newHref && (
              <Link href={newHref} className="inline-flex items-center gap-1.5 px-4 py-2 mt-4 bg-sky-500 text-white text-xs font-semibold rounded-xl">
                <Plus className="w-3.5 h-3.5" /> {newLabel ?? "Nouveau"}
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {selEvents.map((e) => <EventCard key={`${e.kind}-${e.id}`} e={e} />)}
          </div>
        )}
      </div>
    </div>
  );
}
