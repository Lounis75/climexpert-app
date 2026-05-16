"use client";
import { useEffect, useState } from "react";
import { CalendarX2, Plus, Trash2 } from "lucide-react";

type Dispo = { id: string; dateDebut: string; dateFin: string; motif: string | null };

function formatRange(debut: string, fin: string) {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "Europe/Paris" };
  const d = new Date(debut).toLocaleDateString("fr-FR", opts);
  const f = new Date(fin).toLocaleDateString("fr-FR", opts);
  return d === f ? d : `${d} → ${f}`;
}

export default function DisponibilitesPage() {
  const [items, setItems]     = useState<Dispo[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(false);
  const [dateDebut, setDebut] = useState("");
  const [dateFin, setFin]     = useState("");
  const [motif, setMotif]     = useState("");
  const [saving, setSaving]   = useState(false);

  function load() {
    setLoading(true);
    fetch("/api/technicien/disponibilites")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/technicien/disponibilites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dateDebut, dateFin: dateFin || dateDebut, motif }),
    });
    setOpen(false); setDebut(""); setFin(""); setMotif("");
    setSaving(false); load();
  }

  async function remove(id: string) {
    await fetch(`/api/technicien/disponibilites?id=${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Indisponibilités</h1>
        <button
          onClick={() => setOpen(true)}
          className="flex items-center gap-1.5 text-sm font-semibold text-white bg-sky-500 hover:bg-sky-400 px-4 py-2 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Bloquer
        </button>
      </div>

      {open && (
        <form onSubmit={add} className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <p className="font-semibold text-slate-900 text-sm">Nouvelle indisponibilité</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-500 block mb-1">Début</label>
              <input type="date" value={dateDebut} onChange={(e) => setDebut(e.target.value)} required
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">Fin</label>
              <input type="date" value={dateFin} onChange={(e) => setFin(e.target.value)} min={dateDebut}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 block mb-1">Motif (optionnel)</label>
            <input type="text" value={motif} onChange={(e) => setMotif(e.target.value)}
              placeholder="Congés, formation…"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setOpen(false)}
              className="flex-1 py-2 border border-slate-200 text-slate-600 text-sm rounded-xl">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl disabled:opacity-50">
              {saving ? "…" : "Enregistrer"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />)}</div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
          <CalendarX2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Aucune indisponibilité planifiée.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((d) => (
            <div key={d.id} className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4">
              <CalendarX2 className="w-5 h-5 text-slate-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-sm">{formatRange(d.dateDebut, d.dateFin)}</p>
                {d.motif && <p className="text-xs text-slate-500">{d.motif}</p>}
              </div>
              <button onClick={() => remove(d.id)} className="text-slate-300 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
