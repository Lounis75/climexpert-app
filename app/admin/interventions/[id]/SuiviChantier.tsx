"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Circle, Package, Wallet } from "lucide-react";

type State = { acompteRecuLe: string | null; materielCommandeLe: string | null; materielRecuLe: string | null };

function fmt(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "Europe/Paris" });
}

export default function SuiviChantier({ interventionId, initial }: { interventionId: string; initial: State }) {
  const router = useRouter();
  const [s, setS] = useState<State>(initial);
  const [busy, setBusy] = useState<"" | "acompte" | "materiel_recu">("");
  const [error, setError] = useState("");

  async function toggle(jalon: "acompte" | "materiel_recu", value: boolean) {
    setBusy(jalon); setError("");
    try {
      const res = await fetch(`/api/admin/interventions/${interventionId}/suivi-chantier`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jalon, value }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? "Erreur, réessayez."); return; }
      setS({ acompteRecuLe: d.acompteRecuLe ?? null, materielCommandeLe: d.materielCommandeLe ?? null, materielRecuLe: d.materielRecuLe ?? null });
      router.refresh();
    } catch { setError("Erreur réseau, réessayez."); }
    finally { setBusy(""); }
  }

  const acompte = !!s.acompteRecuLe;
  const materiel = !!s.materielRecuLe;

  return (
    <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
      <p className="text-white font-semibold text-sm mb-1 flex items-center gap-2"><Package className="w-4 h-4 text-sky-400" /> Suivi de chantier</p>
      <p className="text-slate-400 text-xs mb-4">Ces jalons sont visibles par le client dans son espace de suivi.</p>

      <div className="space-y-2.5">
        {/* Acompte -> déclenche la commande matériel */}
        <div className="flex items-center justify-between gap-3 bg-slate-900/50 border border-white/10 rounded-xl p-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Wallet className={`w-4 h-4 flex-shrink-0 ${acompte ? "text-emerald-400" : "text-slate-500"}`} />
            <div className="min-w-0">
              <p className="text-white text-sm font-medium">Acompte 30 % reçu</p>
              <p className="text-slate-400 text-[11px]">{acompte ? `Reçu le ${fmt(s.acompteRecuLe)} · commande matériel lancée` : "Déclenche la commande du matériel"}</p>
            </div>
          </div>
          <button onClick={() => toggle("acompte", !acompte)} disabled={!!busy}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${acompte ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300" : "bg-sky-500 border-sky-500 text-white hover:bg-sky-400"} disabled:opacity-50`}>
            {busy === "acompte" ? "…" : acompte ? "Reçu ✓" : "Marquer reçu"}
          </button>
        </div>

        {/* Matériel reçu -> permet la planification */}
        <div className={`flex items-center justify-between gap-3 bg-slate-900/50 border border-white/10 rounded-xl p-3 ${!acompte ? "opacity-60" : ""}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <Package className={`w-4 h-4 flex-shrink-0 ${materiel ? "text-emerald-400" : "text-slate-500"}`} />
            <div className="min-w-0">
              <p className="text-white text-sm font-medium">Matériel reçu</p>
              <p className="text-slate-400 text-[11px]">{materiel ? `Reçu le ${fmt(s.materielRecuLe)} · prêt à planifier` : s.materielCommandeLe ? "Commandé, en attente de réception" : "Après réception de l'acompte"}</p>
            </div>
          </div>
          <button onClick={() => toggle("materiel_recu", !materiel)} disabled={!!busy}
            className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${materiel ? "bg-emerald-500/15 border-emerald-400/40 text-emerald-300" : "bg-sky-500 border-sky-500 text-white hover:bg-sky-400"} disabled:opacity-50`}>
            {busy === "materiel_recu" ? "…" : materiel ? "Reçu ✓" : "Marquer reçu"}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      <p className="text-slate-500 text-[11px] mt-3 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> La planification (date + technicien) et la fin de chantier avancent automatiquement le suivi.</p>
    </div>
  );
}
