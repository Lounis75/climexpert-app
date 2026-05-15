"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Clock } from "lucide-react";

const ACTIONS: Record<string, { label: string; status: string; icon: React.ElementType; cls: string }[]> = {
  en_attente: [
    { label: "Marquer payée",   status: "payée",     icon: CheckCircle, cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" },
    { label: "Marquer en retard", status: "en_retard", icon: Clock,        cls: "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20" },
    { label: "Annuler",         status: "annulée",   icon: XCircle,     cls: "bg-slate-700 border-white/10 text-slate-400 hover:text-white" },
  ],
  en_retard: [
    { label: "Marquer payée", status: "payée",   icon: CheckCircle, cls: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" },
    { label: "Annuler",       status: "annulée", icon: XCircle,     cls: "bg-slate-700 border-white/10 text-slate-400 hover:text-white" },
  ],
};

export default function FactureActions({
  id,
  currentStatus,
}: {
  id: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const actions = ACTIONS[currentStatus] ?? [];

  if (actions.length === 0) return null;

  async function changeStatus(status: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/factures/${id}`, {
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
      {actions.map((a) => (
        <button
          key={a.status}
          onClick={() => changeStatus(a.status)}
          disabled={loading}
          className={`flex items-center gap-1.5 px-3 py-2 border text-xs font-medium rounded-xl transition-all disabled:opacity-40 ${a.cls}`}
        >
          <a.icon className="w-3.5 h-3.5" />
          {a.label}
        </button>
      ))}
    </div>
  );
}
