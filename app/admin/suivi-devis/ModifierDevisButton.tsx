"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";

// « Modifier » un devis envoyé depuis le suivi : recharge l'instantané du chiffrage de cet envoi
// dans le brouillon du prospect puis ouvre l'outil pré-rempli. Le renvoi invalidera l'ancien lien
// client (nouvelle signature requise).
export default function ModifierDevisButton({ leadId, envoiId }: { leadId: string; envoiId: string }) {
  const [busy, setBusy] = useState(false);

  async function modifier() {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/leads/${leadId}/devis/reprendre`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devisId: envoiId }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { alert(d.error ?? "Impossible de reprendre ce devis."); return; }
      window.location.href = d.url ?? `/admin/terrain/chiffrage?lead=${leadId}`;
    } catch {
      alert("Erreur réseau, réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={modifier}
      disabled={busy}
      title="Rouvre le chiffrage pré-rempli ; le renvoi invalide l'ancien lien (nouvelle signature)"
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700/60 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 disabled:opacity-50 text-xs font-medium transition-all flex-shrink-0"
    >
      <Pencil className="w-3 h-3" /> {busy ? "…" : "Modifier"}
    </button>
  );
}
