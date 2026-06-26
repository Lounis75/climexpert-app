"use client";
import { useState, useEffect, useCallback } from "react";
import { CalendarOff, Plus, X, Trash2, HardHat, Building2, Ban } from "lucide-react";

type Membre = {
  id: string; name: string; prenom: string | null;
  externe: boolean; entreprise: string | null; specialite: string | null; color: string | null;
};
type Indispo = {
  id: string; technicienId: string; technicienName: string | null;
  dateDebut: string; dateFin: string; motif: string | null;
};

const fmtDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
const fmtHM = (d: string) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

// Indispo "journée entière" = commence à 00:00 et finit à ~23:59.
function isFullDay(i: Indispo) {
  const s = new Date(i.dateDebut), e = new Date(i.dateFin);
  return s.getHours() === 0 && s.getMinutes() === 0 && e.getHours() === 23 && e.getMinutes() >= 58;
}
function periodeLabel(i: Indispo) {
  const sameDay = new Date(i.dateDebut).toDateString() === new Date(i.dateFin).toDateString();
  if (isFullDay(i)) return sameDay ? fmtDate(i.dateDebut) : `${fmtDate(i.dateDebut)} → ${fmtDate(i.dateFin)}`;
  return `${fmtDate(i.dateDebut)} · ${fmtHM(i.dateDebut)}–${fmtHM(i.dateFin)}`;
}

export default function IndisponibilitesManager({ team }: { team: Membre[] }) {
  const [indispos, setIndispos] = useState<Indispo[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");

  // Formulaire
  const [technicienId, setTechnicienId] = useState(team[0]?.id ?? "");
  const [fullDay, setFullDay]   = useState(true);
  const [du, setDu]             = useState("");
  const [au, setAu]             = useState("");
  const [heureFrom, setHeureFrom] = useState("08:00");
  const [heureTo, setHeureTo]   = useState("12:00");
  const [motif, setMotif]       = useState("");

  const load = useCallback(async () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setFullYear(end.getFullYear() + 2);
    const res = await fetch(`/api/admin/disponibilites?start=${start.toISOString().slice(0, 10)}&end=${end.toISOString().slice(0, 10)}`);
    if (res.ok) { const d = await res.json(); setIndispos(d.indispos ?? []); }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openForm(memberId?: string) {
    const today = new Date().toISOString().slice(0, 10);
    setTechnicienId(memberId ?? team[0]?.id ?? "");
    setFullDay(true); setDu(today); setAu(today);
    setHeureFrom("08:00"); setHeureTo("12:00"); setMotif(""); setError("");
    setShowForm(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!technicienId) { setError("Choisissez un membre de l'équipe"); return; }
    // Heure locale -> ISO (round-trip correct côté planning).
    const debut = fullDay ? new Date(`${du}T00:00:00`) : new Date(`${du}T${heureFrom}:00`);
    const fin   = fullDay ? new Date(`${au || du}T23:59:59`) : new Date(`${du}T${heureTo}:00`);
    if (isNaN(debut.getTime()) || isNaN(fin.getTime()) || fin < debut) { setError("Période invalide"); return; }
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/disponibilites", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technicienId, dateDebut: debut.toISOString(), dateFin: fin.toISOString(), motif }),
      });
      if (!res.ok) { setError("Erreur lors de l'enregistrement"); setSaving(false); return; }
      setShowForm(false);
      await load();
    } catch { setError("Erreur réseau"); }
    finally { setSaving(false); }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette indisponibilité ?")) return;
    setIndispos((p) => p.filter((i) => i.id !== id)); // optimiste
    await fetch(`/api/admin/disponibilites?id=${id}`, { method: "DELETE" }).catch(() => {});
  }

  const salaries = team.filter((m) => !m.externe);
  const soustraitants = team.filter((m) => m.externe);
  const byMember = (id: string) => indispos.filter((i) => i.technicienId === id).sort((a, b) => +new Date(a.dateDebut) - +new Date(b.dateDebut));

  const inputCls = "w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-700/50 text-sm text-white focus:outline-none focus:border-sky-500/50 [color-scheme:dark]";

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <CalendarOff className="w-6 h-6 text-amber-400" /> Congés &amp; indisponibilités
          </h1>
          <p className="text-slate-400 text-sm mt-1">Salariés et sous-traitants. Les périodes bloquées grisent le planning et excluent la personne des créneaux proposés.</p>
        </div>
        <button onClick={() => openForm()}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Bloquer une période
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <form onSubmit={submit} className="bg-slate-800/50 border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-white font-semibold text-sm flex items-center gap-2"><Ban className="w-4 h-4 text-amber-400" /> Nouvelle indisponibilité</p>
            <button type="button" onClick={() => setShowForm(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Membre de l&apos;équipe *</label>
            <select value={technicienId} onChange={(e) => setTechnicienId(e.target.value)} className={inputCls}>
              {salaries.length > 0 && (
                <optgroup label="Salariés">
                  {salaries.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </optgroup>
              )}
              {soustraitants.length > 0 && (
                <optgroup label="Sous-traitants">
                  {soustraitants.map((m) => <option key={m.id} value={m.id}>{m.name}{m.entreprise ? ` (${m.entreprise})` : ""}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          <div className="flex items-center rounded-xl bg-slate-900/60 border border-white/8 p-0.5 w-full sm:w-auto">
            {([["Journée(s) entière(s)", true], ["Créneau horaire", false]] as const).map(([label, v]) => (
              <button key={label} type="button" onClick={() => setFullDay(v)}
                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${fullDay === v ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}>{label}</button>
            ))}
          </div>
          {fullDay ? (
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-slate-400 mb-1.5">Du *</label><input type="date" value={du} onChange={(e) => { setDu(e.target.value); if (au < e.target.value) setAu(e.target.value); }} required className={inputCls} /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">Au</label><input type="date" value={au} onChange={(e) => setAu(e.target.value)} className={inputCls} /></div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <div><label className="block text-xs text-slate-400 mb-1.5">Date *</label><input type="date" value={du} onChange={(e) => setDu(e.target.value)} required className={inputCls} /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">De</label><input type="time" step={1800} value={heureFrom} onChange={(e) => setHeureFrom(e.target.value)} className={inputCls} /></div>
              <div><label className="block text-xs text-slate-400 mb-1.5">À</label><input type="time" step={1800} value={heureTo} onChange={(e) => setHeureTo(e.target.value)} className={inputCls} /></div>
            </div>
          )}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Motif (optionnel)</label>
            <input value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Congés, formation, arrêt…" className={inputCls} />
          </div>
          {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">{saving ? "Enregistrement…" : "Bloquer"}</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-colors">Annuler</button>
          </div>
        </form>
      )}

      {/* Listes */}
      {loading ? (
        <div className="h-32 flex items-center justify-center"><div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          <Section title="Salariés" icon={HardHat} members={salaries} byMember={byMember} onAdd={openForm} onRemove={remove} />
          {soustraitants.length > 0 && (
            <Section title="Sous-traitants" icon={Building2} members={soustraitants} byMember={byMember} onAdd={openForm} onRemove={remove} />
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, members, byMember, onAdd, onRemove }: {
  title: string; icon: React.ElementType; members: Membre[];
  byMember: (id: string) => Indispo[]; onAdd: (id: string) => void; onRemove: (id: string) => void;
}) {
  if (members.length === 0) return null;
  return (
    <section>
      <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {title}</h2>
      <div className="space-y-2">
        {members.map((m) => {
          const list = byMember(m.id);
          return (
            <div key={m.id} className="bg-slate-800/40 border border-white/8 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: m.color ?? "#64748b" }} />
                  <p className="text-white text-sm font-semibold truncate">{m.name}</p>
                  {m.entreprise && <span className="text-slate-500 text-xs truncate">· {m.entreprise}</span>}
                  {m.specialite && <span className="text-slate-600 text-xs truncate hidden sm:inline">· {m.specialite}</span>}
                </div>
                <button onClick={() => onAdd(m.id)} className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 flex-shrink-0 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Bloquer
                </button>
              </div>
              {list.length === 0 ? (
                <p className="text-slate-600 text-xs">Disponible, aucune indisponibilité à venir.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {list.map((i) => (
                    <span key={i.id} className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs rounded-lg pl-2.5 pr-1.5 py-1">
                      {periodeLabel(i)}{i.motif ? ` · ${i.motif}` : ""}
                      <button onClick={() => onRemove(i.id)} className="text-amber-400/60 hover:text-red-400 transition-colors" title="Supprimer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
