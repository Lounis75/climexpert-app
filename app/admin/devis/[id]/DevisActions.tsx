"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Receipt } from "lucide-react";

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
  const [converting, setConverting] = useState(false);
  const next = TRANSITIONS[currentStatus] ?? [];

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

  async function convertirEnFacture() {
    setConverting(true);
    try {
      const res = await fetch("/api/admin/factures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devisId: id }),
      });
      if (res.ok) {
        const { facture } = await res.json();
        router.push(`/admin/factures/${facture.id}`);
      }
    } finally {
      setConverting(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {next.map((s) => (
        <button
          key={s}
          onClick={() => changeStatus(s)}
          disabled={loading || converting}
          className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-xs font-medium rounded-xl transition-all disabled:opacity-40"
        >
          <ChevronDown className="w-3.5 h-3.5" />
          {STATUS_LABELS[s] ?? s}
        </button>
      ))}
      {currentStatus === "accepté" && (
        <button
          onClick={convertirEnFacture}
          disabled={converting || loading}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium rounded-xl transition-all disabled:opacity-40"
        >
          <Receipt className="w-3.5 h-3.5" />
          {converting ? "Création…" : "Convertir en facture"}
        </button>
      )}
    </div>
  );
}
