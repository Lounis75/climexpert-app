"use client";

import { Trash2 } from "lucide-react";

export default function DeleteDevisButton({ devisId }: { devisId: string }) {
  async function onDelete() {
    if (!confirm("Supprimer ce devis définitivement ?")) return;
    const res = await fetch(`/api/admin/devis/${devisId}`, { method: "DELETE" });
    if (res.status === 401) { window.location.href = "/admin"; return; }
    window.location.href = "/admin/devis";
  }
  return (
    <button
      type="button"
      onClick={onDelete}
      className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-xs transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" /> Supprimer ce devis
    </button>
  );
}
