"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, CheckCircle, XCircle, Trash2, CalendarClock, Check } from "lucide-react";

const ACTIONS: Record<string, { label: string; status: string; icon: React.ElementType; cls: string }[]> = {
  planifiée: [
    { label: "Démarrer",  status: "en_cours", icon: Play,        cls: "bg-sky-500/10 border-sky-500/30 text-sky-400 hover:bg-sky-500/20" },
    { label: "Annuler",   status: "annulée",  icon: XCircle,     cls: "bg-slate-700 border-white/10 text-slate-400 hover:text-white" },
  ],
  en_cours: [
    { label: "Terminer",  status: "terminée", icon: CheckCircle, cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" },
    { label: "Annuler",   status: "annulée",  icon: XCircle,     cls: "bg-slate-700 border-white/10 text-slate-400 hover:text-white" },
  ],
};

const TYPES: [string, string][] = [
  ["installation", "Installation"], ["entretien", "Entretien"], ["depannage", "Dépannage"],
  ["contrat-pro", "Contrat pro"], ["autre", "Autre"],
];

function isoToLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

interface Props {
  id: string;
  currentStatus: string;
  notes: string;
  techniciens: { id: string; name: string }[];
  currentTechnicienId: string;
  currentScheduledAt: string;
  currentType: string;
  currentDuree: number;
}

const DUREES: number[] = [30, 60, 90, 120, 180, 240, 300, 360, 480];

export default function InterventionActions({
  id, currentStatus, techniciens, currentTechnicienId, currentScheduledAt, currentType, currentDuree,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(isoToLocal(currentScheduledAt));
  const [technicienId, setTechnicienId] = useState(currentTechnicienId);
  const [type, setType] = useState(currentType);
  const [duree, setDuree] = useState(currentDuree || 120);
  const actions = ACTIONS[currentStatus] ?? [];

  async function changeStatus(status: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/interventions/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally { setLoading(false); }
  }

  async function savePlanning() {
    setLoading(true);
    try {
      await fetch(`/api/admin/interventions/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "planifier",
          scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
          technicienId, type, dureeEstimeeMinutes: duree,
        }),
      });
      setPlanning(false);
      router.refresh();
    } finally { setLoading(false); }
  }

  async function handleDelete() {
    if (!confirm("Supprimer cette intervention ?")) return;
    await fetch(`/api/admin/interventions/${id}`, { method: "DELETE" });
    router.push("/admin/interventions");
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {currentStatus !== "terminée" && currentStatus !== "annulée" && (
          <button
            onClick={() => setPlanning((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 border border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 text-xs font-medium rounded-xl transition-all"
          >
            <CalendarClock className="w-3.5 h-3.5" />
            {currentScheduledAt && currentTechnicienId ? "Replanifier" : "Planifier"}
          </button>
        )}
        {actions.map((a) => (
          <button key={a.status} onClick={() => changeStatus(a.status)} disabled={loading}
            className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-xl transition-all disabled:opacity-40 ${a.cls}`}>
            <a.icon className="w-3.5 h-3.5" /> {a.label}
          </button>
        ))}
        <button onClick={handleDelete} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 border border-white/10 bg-slate-700 text-slate-400 hover:text-red-400 text-xs font-medium rounded-xl transition-all disabled:opacity-40">
          <Trash2 className="w-3.5 h-3.5" /> Supprimer
        </button>
      </div>

      {planning && (
        <div className="w-full sm:w-96 bg-slate-800/60 border border-violet-500/20 rounded-2xl p-4 space-y-3">
          <p className="text-violet-300 text-xs font-semibold flex items-center gap-1.5">
            <CalendarClock className="w-3.5 h-3.5" /> Planifier l&apos;intervention
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs block mb-1">Début</label>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm [color-scheme:dark] focus:outline-none focus:border-violet-500/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Durée (créneau)</label>
              <select value={duree} onChange={(e) => setDuree(Number(e.target.value))}
                className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm appearance-none focus:outline-none focus:border-violet-500/50">
                {DUREES.map((m) => <option key={m} value={m} className="bg-slate-800">{m < 60 ? `${m} min` : `${m / 60} h`}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs block mb-1">Technicien</label>
              <select value={technicienId} onChange={(e) => setTechnicienId(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm appearance-none focus:outline-none focus:border-violet-500/50">
                <option value="">— Non affecté —</option>
                {techniciens.map((t) => <option key={t.id} value={t.id} className="bg-slate-800">{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm appearance-none focus:outline-none focus:border-violet-500/50">
                {TYPES.map(([v, l]) => <option key={v} value={v} className="bg-slate-800">{l}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setPlanning(false)} className="flex-1 px-3 py-2 border border-white/10 text-slate-400 hover:text-white rounded-lg text-xs font-medium">Annuler</button>
            <button onClick={savePlanning} disabled={loading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-violet-500 hover:bg-violet-400 disabled:opacity-50 text-white font-semibold rounded-lg text-xs">
              {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Enregistrer
            </button>
          </div>
          {technicienId && <p className="text-slate-500 text-[11px]">Le technicien sera notifié de l&apos;intervention.</p>}
        </div>
      )}
    </div>
  );
}
