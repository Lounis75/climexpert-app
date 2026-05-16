"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Trash2 } from "lucide-react";

export default function RgpdButtons({ clientId }: { clientId: string }) {
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm("Supprimer définitivement toutes les données de ce client ? Cette action est irréversible.")) return;
    setDeleting(true);
    const res = await fetch(`/api/rgpd/client/${clientId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/admin/clients");
    } else {
      alert("Erreur lors de la suppression.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      <a
        href={`/api/rgpd/export/${clientId}`}
        className="flex items-center gap-1.5 px-3 py-2 bg-slate-700 hover:bg-slate-600 border border-white/10 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-all"
      >
        <Download className="w-3.5 h-3.5" /> Exporter les données
      </a>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="flex items-center gap-1.5 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 border border-red-500/30 text-red-400 text-xs font-semibold rounded-xl transition-all"
      >
        <Trash2 className="w-3.5 h-3.5" /> {deleting ? "Suppression…" : "Effacement RGPD"}
      </button>
    </div>
  );
}
