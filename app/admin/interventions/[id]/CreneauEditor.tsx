"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Check, Pencil } from "lucide-react";

function pad(n: number) { return String(n).padStart(2, "0"); }
function isoToLocal(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function computeEndTime(iso: string, dureeMin: number): string {
  const end = new Date(new Date(iso).getTime() + (dureeMin || 120) * 60000);
  return `${pad(end.getHours())}:${pad(end.getMinutes())}`;
}
function hm(d: Date) { return `${pad(d.getHours())}:${pad(d.getMinutes())}`; }

/** Carte « Créneau » directement modifiable : date + heure de début + heure de fin. */
export default function CreneauEditor({ id, scheduledAt, dureeMin }: { id: string; scheduledAt: string | null; dureeMin: number | null }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState(scheduledAt ? isoToLocal(scheduledAt) : "");
  const [endTime, setEndTime] = useState(scheduledAt ? computeEndTime(scheduledAt, dureeMin ?? 120) : "");

  const startDate = scheduledAt ? new Date(scheduledAt) : null;
  const displayDate = startDate
    ? startDate.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "-";
  const range = startDate
    ? `${hm(startDate)}${dureeMin ? ` – ${hm(new Date(startDate.getTime() + dureeMin * 60000))} (${dureeMin < 60 ? `${dureeMin} min` : `${dureeMin / 60} h`})` : ""}`
    : "";

  async function save() {
    setLoading(true);
    let duree = dureeMin ?? 120;
    if (start && endTime) {
      const s = new Date(start);
      const [eh, em] = endTime.split(":").map(Number);
      const e = new Date(s); e.setHours(eh, em, 0, 0);
      const diff = Math.round((e.getTime() - s.getTime()) / 60000);
      if (diff > 0) duree = diff;
    }
    try {
      await fetch(`/api/admin/interventions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "planifier",
          scheduledAt: start ? new Date(start).toISOString() : null,
          dureeEstimeeMinutes: duree,
        }),
      });
      setEditing(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3 sm:col-span-2">
      <div className="flex items-start gap-3">
        <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">Créneau</p>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors">
                <Pencil className="w-3 h-3" /> Modifier l&apos;horaire
              </button>
            )}
          </div>

          {!editing ? (
            <>
              <p className="text-white text-sm capitalize">{displayDate}</p>
              {range && <p className="text-slate-400 text-xs mt-0.5">{range}</p>}
            </>
          ) : (
            <div className="space-y-2.5 mt-2">
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Date &amp; heure de début</label>
                <input
                  type="datetime-local" step={1800}
                  value={start}
                  onChange={(e) => {
                    const v = e.target.value;
                    setStart(v);
                    if (v && (!endTime || new Date(`${v.slice(0, 10)}T${endTime}`) <= new Date(v))) {
                      setEndTime(computeEndTime(new Date(v).toISOString(), 120));
                    }
                  }}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm [color-scheme:dark] focus:outline-none focus:border-sky-500/50"
                />
              </div>
              <div>
                <label className="text-slate-400 text-[11px] block mb-1">Heure de fin (créneau)</label>
                <input
                  type="time" step={1800}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm [color-scheme:dark] focus:outline-none focus:border-sky-500/50"
                />
                <p className="text-slate-500 text-[10px] mt-1">Ex. début 08:00 + fin 10:00 = créneau 8h–10h.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex-1 px-3 py-1.5 border border-white/10 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition-colors">
                  Annuler
                </button>
                <button onClick={save} disabled={loading} className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-lg text-xs transition-colors">
                  {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Enregistrer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
