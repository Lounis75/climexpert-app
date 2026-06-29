"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Check, Pencil } from "lucide-react";

/** Carte « Technicien / sous-traitant » directement assignable depuis la fiche d'intervention.
 *  Assigner un technicien fait passer le client en production (cf. getEnProductionLeadIdSet). */
export default function TechnicienEditor({ id, technicienId, technicienName, techniciens }: {
  id: string;
  technicienId: string | null;
  technicienName: string | null;
  techniciens: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState(technicienId ?? "");

  async function save() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/interventions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "planifier", technicienId: value || null }),
      });
      if (!res.ok) { alert("Échec de l'enregistrement, réessayez."); return; }
      setEditing(false);
      router.refresh();
    } catch { alert("Erreur réseau, réessayez."); }
    finally { setLoading(false); }
  }

  return (
    <div className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3">
      <div className="flex items-start gap-3">
        <User className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-slate-500">Technicien / sous-traitant</p>
            {!editing && (
              <button onClick={() => { setValue(technicienId ?? ""); setEditing(true); }} className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors">
                <Pencil className="w-3 h-3" /> {technicienId ? "Changer" : "Assigner"}
              </button>
            )}
          </div>

          {!editing ? (
            <p className={`text-sm mt-0.5 ${technicienName ? "text-white font-medium" : "text-amber-300"}`}>{technicienName ?? "Non assigné"}</p>
          ) : (
            <div className="space-y-2.5 mt-2">
              <select value={value} onChange={(e) => setValue(e.target.value)} className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm focus:outline-none focus:border-sky-500/50">
                <option value="" className="bg-slate-800">Non assigné</option>
                {techniciens.map((t) => <option key={t.id} value={t.id} className="bg-slate-800">{t.name}</option>)}
              </select>
              <div className="flex gap-2">
                <button onClick={() => setEditing(false)} className="flex-1 px-3 py-1.5 border border-white/10 text-slate-400 hover:text-white rounded-lg text-xs font-medium transition-colors">Annuler</button>
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
