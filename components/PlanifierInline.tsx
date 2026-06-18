"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Check } from "lucide-react";

type Option = { id: string; name: string; prenom: string | null };

/** Planifie rapidement une intervention sans date (ex. créée à la signature d'un
 *  devis) : date/heure + technicien -> PATCH action "planifier". */
export default function PlanifierInline({
  interventionId, currentTechnicienId, techniciens,
}: {
  interventionId: string;
  currentTechnicienId: string | null;
  techniciens: Option[];
}) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [technicienId, setTechnicienId] = useState(currentTechnicienId ?? "");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function planifier() {
    if (!date) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/interventions/${interventionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "planifier", scheduledAt: new Date(date).toISOString(), technicienId: technicienId || null }),
      });
      if (res.status === 401) { window.location.href = "/admin"; return; }
      if (!res.ok) { alert("Échec de la planification. Réessayez."); return; }
      setDone(true);
      setTimeout(() => router.refresh(), 700);
    } catch {
      alert("Erreur réseau. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium"><Check className="w-4 h-4" /> Planifiée</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="datetime-local"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="text-xs bg-slate-900/70 border border-white/15 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500/50 [color-scheme:dark]"
      />
      <select
        value={technicienId}
        onChange={(e) => setTechnicienId(e.target.value)}
        className="appearance-none text-xs bg-slate-900/70 border border-white/15 rounded-lg pl-2.5 pr-6 py-1.5 text-slate-200 cursor-pointer focus:outline-none focus:border-emerald-500/50"
      >
        <option value="">Technicien…</option>
        {techniciens.map((t) => (
          <option key={t.id} value={t.id}>{t.prenom ? `${t.prenom} ${t.name}` : t.name}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={planifier}
        disabled={!date || saving}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white transition-colors"
      >
        <CalendarPlus className="w-3.5 h-3.5" /> Planifier
      </button>
    </div>
  );
}
