"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, CheckCircle2 } from "lucide-react";

export default function InterventionStatusButton({ id, currentStatus }: { id: string; currentStatus: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function update(status: string) {
    setLoading(true);
    await fetch(`/api/technicien/interventions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    router.refresh();
    setLoading(false);
  }

  if (currentStatus === "planifiée") {
    return (
      <button
        onClick={() => update("en_cours")}
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
      >
        <Play className="w-5 h-5" />
        {loading ? "…" : "Démarrer l'intervention"}
      </button>
    );
  }

  return null;
}
