"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

const TRANSITIONS: Record<string, string[]> = {
  brouillon:  ["envoyé"],
  envoyé:     ["accepté", "refusé", "expiré"],
  accepté:    [],
  refusé:     [],
  expiré:     [],
};

const STATUS_LABELS: Record<string, string> = {
  envoyé:  "Marquer envoyé",
  accepté: "Marquer accepté",
  refusé:  "Marquer refusé",
  expiré:  "Marquer expiré",
};

export default function DevisActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const next = TRANSITIONS[currentStatus] ?? [];

  if (next.length === 0) return null;

  async function changeStatus(status: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/devis/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {next.map((s) => (
        <button
          key={s}
          onClick={() => changeStatus(s)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-xs font-medium rounded-xl transition-all disabled:opacity-40"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          {STATUS_LABELS[s] ?? s}
        </button>
      ))}
    </div>
  );
}
