"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { User, Briefcase, MapPin, ChevronDown, Wrench, Plus, CalendarClock, Handshake } from "lucide-react";
import { TYPE_LABELS, STATUS_INTERVENTION } from "@/lib/interventions-ui";

// Événement de planning unifié : intervention (terrain) OU rendez-vous commercial.
export type PlanningEvent = {
  id: string;
  kind: "intervention" | "rdv";
  title: string;
  start: string | null;          // ISO
  durationMin: number | null;
  category: string;              // type d'intervention, ou "rdv"
  status?: string | null;
  assignee?: string | null;      // technicien (intervention) / commercial (rdv)
  address?: string | null;
  href: string;
};

// Barre latérale colorée par type de prestation ; les RDV ont leur propre couleur.
const TYPE_BAR: Record<string, string> = {
  installation:  "bg-sky-500",
  entretien:     "bg-emerald-500",
  depannage:     "bg-red-500",
  "contrat-pro": "bg-violet-500",
  autre:         "bg-slate-500",
};
const RDV_BAR = "bg-fuchsia-500";
const RDV_BADGE = "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30";

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const fmtTime = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const fmtDay = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

export function EventCard({ e }: { e: PlanningEvent }) {
  const d = e.start ? new Date(e.start) : null;
  const isRdv = e.kind === "rdv";
  const bar = isRdv ? RDV_BAR : (TYPE_BAR[e.category] ?? TYPE_BAR.autre);
  const status = e.status ? STATUS_INTERVENTION[e.status] : null;
  return (
    <Link
      href={e.href}
      className="flex items-stretch gap-3 bg-slate-800/50 border border-white/8 rounded-2xl overflow-hidden active:bg-white/10 transition-colors"
    >
      <span className={`w-1.5 flex-shrink-0 ${bar}`} />
      <div className="flex-1 min-w-0 pr-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-white text-sm font-bold tabular-nums">
            {d ? fmtTime(d) : "-"}
            {e.durationMin ? <span className="text-slate-500 font-normal text-xs ml-1.5">· {e.durationMin} min</span> : null}
          </span>
          {isRdv ? (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${RDV_BADGE}`}>RDV</span>
          ) : status ? (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${status.color}`}>{status.label}</span>
          ) : null}
        </div>
        <p className="text-white text-sm font-semibold truncate mt-1">{e.title}</p>
        <div className="flex items-center gap-2.5 mt-1 text-[11px] flex-wrap">
          <span className="flex items-center gap-1 text-slate-300">
            {isRdv ? <Handshake className="w-3 h-3 text-fuchsia-400" /> : null}
            {isRdv ? "Rendez-vous" : (TYPE_LABELS[e.category] ?? e.category)}
          </span>
          {e.assignee && (
            <span className="flex items-center gap-1 text-slate-400">
              {isRdv ? <Briefcase className="w-3 h-3 flex-shrink-0" /> : <User className="w-3 h-3 flex-shrink-0" />}
              {e.assignee}
            </span>
          )}
        </div>
        {e.address && (
          <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0" />{e.address}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function AgendaMobile({
  events,
  emptyTitle = "Aucun élément planifié",
  emptySubtitle = "Les interventions et rendez-vous apparaîtront ici.",
  newHref,
  newLabel,
}: {
  events: PlanningEvent[];
  emptyTitle?: string;
  emptySubtitle?: string;
  newHref?: string;
  newLabel?: string;
}) {
  const [showPast, setShowPast] = useState(false);
  const todayRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayKey = dayKey(todayStart);

  const { upcomingGroups, pastGroups, pastCount, nextItem } = useMemo(() => {
    const dated = events.filter((e) => e.start);
    const sorted = [...dated].sort((a, b) => new Date(a.start!).getTime() - new Date(b.start!).getTime());

    const map = new Map<string, { date: Date; items: PlanningEvent[] }>();
    for (const e of sorted) {
      const d = startOfDay(new Date(e.start!));
      const k = dayKey(d);
      if (!map.has(k)) map.set(k, { date: d, items: [] });
      map.get(k)!.items.push(e);
    }
    const all = [...map.values()];
    const upcoming = all.filter((g) => g.date.getTime() >= todayStart.getTime());
    const past = all.filter((g) => g.date.getTime() < todayStart.getTime()).reverse();
    const pCount = past.reduce((s, g) => s + g.items.length, 0);
    const next = sorted.find((e) => new Date(e.start!).getTime() >= now.getTime()) ?? null;
    return { upcomingGroups: upcoming, pastGroups: past, pastCount: pCount, nextItem: next };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events]);

  const isEmpty = upcomingGroups.length === 0 && pastGroups.length === 0;

  if (isEmpty) {
    return (
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4">
          <CalendarClock className="w-5 h-5 text-sky-400" />
        </div>
        <h2 className="text-white font-semibold mb-2">{emptyTitle}</h2>
        <p className="text-slate-400 text-sm mb-6">{emptySubtitle}</p>
        {newHref && (
          <Link href={newHref} className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white text-xs font-semibold rounded-xl">
            <Plus className="w-3.5 h-3.5" /> {newLabel ?? "Nouveau"}
          </Link>
        )}
      </div>
    );
  }

  function scrollToToday() {
    todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const hasToday = upcomingGroups.some((g) => dayKey(g.date) === todayKey);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-xs font-medium capitalize">
          {now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
        </span>
        {hasToday && (
          <button onClick={scrollToToday} className="text-sky-400 text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-500/10 active:bg-sky-500/20">
            Aujourd&apos;hui
          </button>
        )}
      </div>

      {/* Prochain élément (épinglé) */}
      {nextItem && nextItem.start && (
        <Link
          href={nextItem.href}
          className={`block rounded-2xl p-4 mb-5 transition-colors border ${
            nextItem.kind === "rdv" ? "bg-fuchsia-500/10 border-fuchsia-500/40 active:bg-fuchsia-500/15" : "bg-sky-500/10 border-sky-500/40 active:bg-sky-500/15"
          }`}
        >
          <div className={`flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold mb-2 ${nextItem.kind === "rdv" ? "text-fuchsia-400" : "text-sky-400"}`}>
            {nextItem.kind === "rdv" ? <Handshake className="w-3.5 h-3.5" /> : <CalendarClock className="w-3.5 h-3.5" />}
            {nextItem.kind === "rdv" ? "Prochain rendez-vous" : "Prochaine intervention"}
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-white text-lg font-bold capitalize">
              {new Date(nextItem.start).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
            </span>
            <span className={`text-lg font-bold tabular-nums ${nextItem.kind === "rdv" ? "text-fuchsia-300" : "text-sky-300"}`}>{fmtTime(new Date(nextItem.start))}</span>
          </div>
          <p className="text-white text-sm font-semibold mt-1">{nextItem.title}</p>
          {nextItem.assignee && (
            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
              {nextItem.kind === "rdv" ? <Briefcase className="w-3 h-3" /> : <User className="w-3 h-3" />}{nextItem.assignee}
            </div>
          )}
          {nextItem.address && (
            <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 truncate"><MapPin className="w-3 h-3 flex-shrink-0" />{nextItem.address}</p>
          )}
        </Link>
      )}

      {/* Groupes par jour */}
      {upcomingGroups.map((g) => {
        const isToday = dayKey(g.date) === todayKey;
        return (
          <div key={dayKey(g.date)} ref={isToday ? todayRef : undefined} className="scroll-mt-16">
            <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-[#080d18]/95 backdrop-blur-sm border-b border-white/8 flex items-center justify-between">
              <span className={`text-xs font-semibold capitalize ${isToday ? "text-amber-400" : "text-slate-200"}`}>
                {isToday ? "Aujourd'hui, " : ""}{fmtDay(g.date)}
              </span>
              <span className="text-[10px] text-slate-500 flex-shrink-0">{g.items.length} élément{g.items.length > 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2 pt-2.5 pb-4">
              {g.items.map((e) => <EventCard key={`${e.kind}-${e.id}`} e={e} />)}
            </div>
          </div>
        );
      })}

      {/* Passés (repliable) */}
      {pastGroups.length > 0 && (
        <div className="mt-2 border-t border-white/8 pt-3">
          <button onClick={() => setShowPast((v) => !v)} className="flex items-center justify-between w-full py-1.5 text-slate-400 text-xs font-semibold active:text-white">
            <span>Passés · {pastCount}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showPast ? "rotate-180" : ""}`} />
          </button>
          {showPast && (
            <div className="mt-2 opacity-70">
              {pastGroups.map((g) => (
                <div key={dayKey(g.date)}>
                  <div className="sticky top-14 z-10 -mx-4 sm:-mx-6 px-4 sm:px-6 py-1.5 bg-[#080d18]/95 backdrop-blur-sm">
                    <span className="text-[11px] font-semibold text-slate-500 capitalize">{fmtDay(g.date)}</span>
                  </div>
                  <div className="space-y-2 pt-1.5 pb-3">
                    {g.items.map((e) => <EventCard key={`${e.kind}-${e.id}`} e={e} />)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
