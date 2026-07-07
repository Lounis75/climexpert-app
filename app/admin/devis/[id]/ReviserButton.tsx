"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FilePlus2 } from "lucide-react";

// Sur un devis ACCEPTÉ (verrouillé) : crée un devis révisé pré-rempli, en brouillon, et ouvre
// directement le formulaire de modification pour ajuster le prix (nouvelle signature ensuite).
export default function ReviserButton({ devisId }: { devisId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function reviser() {
    if (!confirm("Créer un devis révisé ? Le devis signé reste intact ; le nouveau devis (brouillon) reprendra les mêmes lignes, à ajuster puis renvoyer pour une nouvelle signature.")) return;
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/admin/devis/${devisId}/reviser`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.devis?.id) { setError(d.error ?? "Révision impossible, réessayez."); return; }
      router.push(`/admin/devis/${d.devis.id}/modifier`);
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        onClick={reviser}
        disabled={busy}
        className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 text-xs font-medium rounded-xl transition-all"
        title="Le devis signé ne se modifie pas : on crée une révision pré-remplie, à ajuster puis faire signer."
      >
        <FilePlus2 className="w-3.5 h-3.5" /> {busy ? "Création…" : "Réviser (nouveau devis)"}
      </button>
      {error && <span className="text-red-400 text-xs">{error}</span>}
    </span>
  );
}
