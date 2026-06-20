"use client";

import { useState } from "react";
import { Check } from "lucide-react";

type Option = { id: string; name: string; prenom?: string | null };

/** Affectation rapide depuis le dashboard :
 *  - kind="commercial" : affecte un commercial à un prospect (PATCH /api/admin/leads)
 *  - kind="technicien" : affecte un technicien à une intervention (PATCH planifier) */
export default function InlineAssign({
  kind, targetId, currentId, options,
}: {
  kind: "commercial" | "technicien";
  targetId: string;
  currentId: string | null;
  options: Option[];
}) {
  const [value, setValue] = useState(currentId ?? "");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  async function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value;
    const prev = value;
    setValue(next);
    setSaving(true);
    setOk(false);
    try {
      const res = kind === "commercial"
        ? await fetch("/api/admin/leads", {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: targetId, commercialId: next || null }),
          })
        : await fetch(`/api/admin/interventions/${targetId}`, {
            method: "PATCH", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "planifier", technicienId: next || null }),
          });
      if (res.status === 401) { window.location.href = "/admin"; return; }
      if (!res.ok) { setValue(prev); alert("Échec de l'affectation. Réessayez."); return; }
      setOk(true);
      setTimeout(() => setOk(false), 1500);
    } catch {
      setValue(prev);
      alert("Erreur réseau. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  const accent = kind === "commercial" ? "focus:border-violet-500/50" : "focus:border-emerald-500/50";

  return (
    <div className="flex items-center gap-1">
      <select
        value={value}
        onChange={onChange}
        disabled={saving}
        onClick={(e) => e.stopPropagation()}
        className={`appearance-none text-sm bg-slate-900/70 border rounded-lg pl-3 pr-8 py-2.5 text-slate-200 cursor-pointer focus:outline-none disabled:opacity-50 ${value ? "border-white/15" : "border-amber-500/30 text-amber-300"} ${accent}`}
      >
        <option value="">{kind === "commercial" ? "Commercial…" : "Technicien…"}</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>{o.prenom ? `${o.prenom} ${o.name}` : o.name}</option>
        ))}
      </select>
      {ok && <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
    </div>
  );
}
