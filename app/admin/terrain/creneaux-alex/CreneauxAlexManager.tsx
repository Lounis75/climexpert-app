"use client";

import { useState } from "react";
import { Plus, Trash2, CalendarClock, Bot, CheckCircle2 } from "lucide-react";

type Creneau = {
  id: string; debut: string; fin: string; statut: string;
  commercialId: string | null; commercialName: string | null; leadId: string | null;
};
type Commercial = { id: string; name: string };

const inp = "bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-sky-500/50 [color-scheme:dark]";

function fmt(d: string) {
  const x = new Date(d);
  const jour = x.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });
  const h = x.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  return `${jour} ${h}`;
}

export default function CreneauxAlexManager({ initial, commerciaux }: { initial: Creneau[]; commerciaux: Commercial[] }) {
  const [creneaux, setCreneaux] = useState<Creneau[]>(initial);
  const [date, setDate] = useState("");
  const [heure, setHeure] = useState("09:00");
  const [duree, setDuree] = useState(60);
  const [commercialId, setCommercialId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function call(payload: Record<string, unknown>) {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/admin/creneaux-alex", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? "Erreur, réessayez."); return; }
      setCreneaux(d.creneaux);
    } catch { setError("Erreur réseau, réessayez."); }
    finally { setBusy(false); }
  }

  async function add() {
    if (!date || !heure) { setError("Choisissez une date et une heure."); return; }
    const debut = new Date(`${date}T${heure}:00`);
    const fin = new Date(debut.getTime() + duree * 60000);
    await call({ debut: debut.toISOString(), fin: fin.toISOString(), commercialId: commercialId || null });
  }

  const ouverts = creneaux.filter((c) => c.statut === "ouvert");
  const reserves = creneaux.filter((c) => c.statut === "reserve");

  return (
    <div className="space-y-6">
      {/* Ajout */}
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
        <p className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><Plus className="w-4 h-4 text-sky-400" /> Ouvrir un créneau de visite</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Heure</label>
            <input type="time" value={heure} onChange={(e) => setHeure(e.target.value)} step={900} className={inp} />
          </div>
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Durée</label>
            <select value={duree} onChange={(e) => setDuree(Number(e.target.value))} className={inp}>
              <option value={30}>30 min</option>
              <option value={60}>1 h</option>
              <option value={90}>1 h 30</option>
              <option value={120}>2 h</option>
            </select>
          </div>
          {commerciaux.length > 0 && (
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Commercial (facultatif)</label>
              <select value={commercialId} onChange={(e) => setCommercialId(e.target.value)} className={inp}>
                <option value="">Non attribué</option>
                {commerciaux.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <button onClick={add} disabled={busy} className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors">Ouvrir</button>
        </div>
        {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
        <p className="text-slate-500 text-[11px] mt-3">Alex proposera ces créneaux aux prospects qualifiés et en réservera un automatiquement. Les créneaux passés disparaissent.</p>
      </div>

      {/* Ouverts */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Créneaux ouverts ({ouverts.length})</p>
        {ouverts.length === 0 ? (
          <p className="text-slate-500 text-sm">Aucun créneau ouvert. Ajoutez-en pour qu'Alex puisse poser des rendez-vous.</p>
        ) : (
          <div className="space-y-2">
            {ouverts.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 bg-slate-800/40 border border-white/8 rounded-xl px-4 py-2.5">
                <div className="flex items-center gap-2 text-sm text-white">
                  <CalendarClock className="w-4 h-4 text-sky-400" /> {fmt(c.debut)}
                  <span className="text-slate-500">→ {new Date(c.fin).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}</span>
                  {c.commercialName && <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">{c.commercialName}</span>}
                </div>
                <button onClick={() => call({ action: "delete", id: c.id })} disabled={busy} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Réservés par Alex */}
      {reserves.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Réservés par Alex ({reserves.length})</p>
          <div className="space-y-2">
            {reserves.map((c) => (
              <div key={c.id} className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-emerald-200">
                <Bot className="w-4 h-4 text-emerald-400" /> <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {fmt(c.debut)}
                <span className="text-emerald-400/70 text-xs">rendez-vous posé</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
