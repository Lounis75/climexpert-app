"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";

export default function InterventionStatusButton({ id, currentStatus }: { id: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function update(status: string) {
    setLoading(true); setError("");
    // try/catch/finally : sur coupure réseau (chantier), l'ancien code laissait le bouton
    // bloqué sur "…" pour toujours, sans dire si l'intervention avait démarré ou non.
    try {
      const res = await fetch(`/api/technicien/interventions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Échec du démarrage, réessayez.");
        return;
      }
      router.refresh();
    } catch {
      setError("Pas de réseau : l'intervention n'a pas démarré. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (currentStatus === "planifiée") {
    return (
      <div className="space-y-2">
        <button
          onClick={() => update("en_cours")}
          disabled={loading}
          className="flex items-center justify-center gap-2 w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
        >
          <Play className="w-5 h-5" />
          {loading ? "Démarrage…" : "Démarrer l'intervention"}
        </button>
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}
      </div>
    );
  }

  return null;
}
