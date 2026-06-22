"use client";

import { useState } from "react";
import { List, CalendarDays } from "lucide-react";
import AgendaMobile, { type PlanningEvent } from "./AgendaMobile";
import MonthAgendaMobile from "./MonthAgendaMobile";

/** Planning mobile : bascule entre la vue Liste (par défaut) et la vue Mois
 *  (façon calendrier Apple). Les deux consomment les mêmes événements. */
export default function PlanningMobile({
  events, emptyTitle, emptySubtitle, newHref, newLabel,
}: {
  events: PlanningEvent[];
  emptyTitle?: string;
  emptySubtitle?: string;
  newHref?: string;
  newLabel?: string;
}) {
  const [view, setView] = useState<"liste" | "mois">("liste");

  return (
    <div>
      {/* Sélecteur de vue */}
      <div className="flex items-center gap-1 bg-slate-800/60 border border-white/10 rounded-xl p-1 mb-4">
        {([
          { v: "liste", l: "Liste", icon: List },
          { v: "mois", l: "Mois", icon: CalendarDays },
        ] as const).map(({ v, l, icon: Icon }) => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              view === v ? "bg-sky-500 text-white" : "text-slate-400 active:text-white"
            }`}>
            <Icon className="w-3.5 h-3.5" /> {l}
          </button>
        ))}
      </div>

      {view === "liste" ? (
        <AgendaMobile events={events} emptyTitle={emptyTitle} emptySubtitle={emptySubtitle} newHref={newHref} newLabel={newLabel} />
      ) : (
        <MonthAgendaMobile events={events} newHref={newHref} newLabel={newLabel} />
      )}
    </div>
  );
}
