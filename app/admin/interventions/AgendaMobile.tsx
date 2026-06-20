"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { User, MapPin, ChevronDown, Wrench, Plus, CalendarClock } from "lucide-react";
import { TYPE_LABELS, STATUS_INTERVENTION } from "@/lib/interventions";

export type AgendaItem = {
  id: string;
  scheduledAt: string | null;
  dureeEstimeeMinutes: number | null;
  type: string;
  status: string;
  clientName: string;
  technicienName?: string;
  address?: string | null;
};

// Barre latérale colorée par type de prestation (repère visuel rapide).
const TYPE_BAR: Record<string, string> = {
  installation:  "bg-sky-500",
  entretien:     "bg-emerald-500",
  depannage:     "bg-red-500",
  "contrat-pro": "bg-violet-500",
  autre:         "bg-slate-500",
};

const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const dayKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const fmtTime = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const fmtDay = (d: Date) => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

function EventCard({ i, dense = false }: { i: AgendaItem; dense?: boolean }) {
  const d = i.scheduledAt ? new Date(i.scheduledAt) : null;
  const status = STATUS_INTERVENTION[i.status] ?? STATUS_INTERVENTION.planifiée;
  const bar = TYPE_BAR[i.type] ?? TYPE_BAR.autre;
  return (
    <Link
      href={`/admin/interventions/${i.id}`}
      className="flex items-stretch gap-3 bg-slate-800/50 border border-white/8 rounded-2xl overflow-hidden active:bg-white/10 transition-colors"
    >
      <span className={`w-1.5 flex-shrink-0 ${bar}`} />
      <div className={`flex-1 min-w-0 pr-3 ${dense ? "py-2.5" : "py-3"}`}>
        <div className="flex items-center justify-between gap-2">
          <span className="text-white text-sm font-bold tabular-nums">
            {d ? fmtTime(d) : "—"}
            {i.dureeEstimeeMinutes ? <span className="text-slate-500 font-normal text-xs ml-1.5">· {i.dureeEstimeeMinutes} min</span> : null}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${status.color}`}>{status.label}</span>
        </div>
        <p className="text-white text-sm font-semibold truncate mt-1">{i.clientName}</p>
        <div className="flex items-center gap-2.5 mt-1 text-[11px] flex-wrap">
          <span className="text-slate-300">{TYPE_LABELS[i.type] ?? i.type}</span>
          {i.technicienName && (
            <span className="flex items-center gap-1 text-slate-400"><User className="w-3 h-3 flex-shrink-0" />{i.technicienName}</span>
          )}
        </div>
        {i.address && (
          <p className="flex items-center gap-1 text-[11px] text-slate-500 mt-1 truncate">
            <MapPin className="w-3 h-3 flex-shrink-0" />{i.address}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function AgendaMobile({ interventions }: { interventions: AgendaItem[] }) {
  const [showPast, setShowPast] = useState(false);
  const todayRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const todayStart = startOfDay(now);
  const todayKey = dayKey(todayStart);

  const { upcomingGroups, pastGroups, pastCount, nextItem } = useMemo(() => {
    const active = interventions.filter((i) => i.status !== "annulée" && i.scheduledAt);
    const sorted = [...active].sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

    const map = new Map<string, { date: Date; items: AgendaItem[] }>();
    for (const i of sorted) {
      const d = startOfDay(new Date(i.scheduledAt!));
      const k = dayKey(d);
      if (!map.has(k)) map.set(k, { date: d, items: [] });
      map.get(k)!.items.push(i);
    }
    const all = [...map.values()];
    const upcoming = all.filter((g) => g.date.getTime() >= todayStart.getTime());
    const past = all.filter((g) => g.date.getTime() < todayStart.getTime()).reverse(); // plus récent d'abord
    const pCount = past.reduce((s, g) => s + g.items.length, 0);
    const next = sorted.find((i) => new Date(i.scheduledAt!).getTime() >= now.getTime()) ?? null;
    return { upcomingGroups: upcoming, pastGroups: past, pastCount: pCount, nextItem: next };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interventions]);

  const isEmpty = upcomingGroups.length === 0 && pastGroups.length === 0;

  if (isEmpty) {
    return (
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-10 text-center">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-5 h-5 text-sky-400" />
        </div>
        <h2 className="text-white font-semibold mb-2">Aucune intervention planifiée</h2>
        <p className="text-slate-400 text-sm mb-6">Planifiez des visites chez vos clients.</p>
        <Link href="/admin/interventions/new" className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 text-white text-xs font-semibold rounded-xl">
          <Plus className="w-3.5 h-3.5" /> Nouvelle intervention
        </Link>
      </div>
    );
  }

  function scrollToToday() {
    todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const hasToday = upcomingGroups.some((g) => dayKey(g.date) === todayKey);

  return (
    <div>
      {/* Barre d'outils agenda */}
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

      {/* Prochaine prestation (épinglée) */}
      {nextItem && nextItem.scheduledAt && (
        <Link
          href={`/admin/interventions/${nextItem.id}`}
          className="block bg-sky-500/10 border border-sky-500/40 rounded-2xl p-4 mb-5 active:bg-sky-500/15 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-sky-400 text-[10px] uppercase tracking-widest font-bold mb-2">
            <CalendarClock className="w-3.5 h-3.5" /> Prochaine prestation
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-white text-lg font-bold capitalize">
              {new Date(nextItem.scheduledAt).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
            </span>
            <span className="text-sky-300 text-lg font-bold tabular-nums">{fmtTime(new Date(nextItem.scheduledAt))}</span>
          </div>
          <p className="text-white text-sm font-semibold mt-1">{nextItem.clientName}</p>
          <div className="flex items-center gap-2.5 mt-1 text-[11px] flex-wrap">
            <span className="text-slate-300">{TYPE_LABELS[nextItem.type] ?? nextItem.type}</span>
            {nextItem.technicienName && (
              <span className="flex items-center gap-1 text-slate-400"><User className="w-3 h-3" />{nextItem.technicienName}</span>
            )}
          </div>
          {nextItem.address && (
            <p className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 truncate"><MapPin className="w-3 h-3 flex-shrink-0" />{nextItem.address}</p>
          )}
        </Link>
      )}

      {/* Groupes par jour (à venir + aujourd'hui) */}
      {upcomingGroups.map((g) => {
        const isToday = dayKey(g.date) === todayKey;
        return (
          <div key={dayKey(g.date)} ref={isToday ? todayRef : undefined} className="scroll-mt-16">
            <div className="sticky top-14 z-20 -mx-4 sm:-mx-6 px-4 sm:px-6 py-2 bg-[#080d18]/95 backdrop-blur-sm border-b border-white/8 flex items-center justify-between">
              <span className={`text-xs font-semibold capitalize ${isToday ? "text-amber-400" : "text-slate-200"}`}>
                {isToday ? "Aujourd'hui — " : ""}{fmtDay(g.date)}
              </span>
              <span className="text-[10px] text-slate-500 flex-shrink-0">{g.items.length} prestation{g.items.length > 1 ? "s" : ""}</span>
            </div>
            <div className="space-y-2 pt-2.5 pb-4">
              {g.items.map((i) => <EventCard key={i.id} i={i} />)}
            </div>
          </div>
        );
      })}

      {/* Passées (repliable) */}
      {pastGroups.length > 0 && (
        <div className="mt-2 border-t border-white/8 pt-3">
          <button onClick={() => setShowPast((v) => !v)} className="flex items-center justify-between w-full py-1.5 text-slate-400 text-xs font-semibold active:text-white">
            <span>Passées · {pastCount}</span>
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
                    {g.items.map((i) => <EventCard key={i.id} i={i} dense />)}
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
