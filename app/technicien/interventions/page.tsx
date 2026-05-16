"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Filter } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Autre",
};
const STATUS_COLORS: Record<string, string> = {
  "planifiée":  "bg-sky-50 text-sky-700 border-sky-200",
  "en_cours":   "bg-amber-50 text-amber-700 border-amber-200",
  "terminée":   "bg-emerald-50 text-emerald-700 border-emerald-200",
  "annulée":    "bg-slate-50 text-slate-500 border-slate-200",
};

type Filter = "upcoming" | "today" | "past";

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });
}
function formatTime(d: string | null) {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
}

export default function InterventionsPage() {
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [items, setItems]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/technicien/interventions?filter=${filter}`)
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Mes interventions</h1>
        <Filter className="w-4 h-4 text-slate-400" />
      </div>

      <div className="flex gap-2">
        {(["upcoming", "today", "past"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl border transition-colors ${
              filter === f
                ? "bg-sky-500 text-white border-sky-500"
                : "bg-white text-slate-500 border-slate-200"
            }`}
          >
            {f === "upcoming" ? "À venir" : f === "today" ? "Aujourd'hui" : "Passées"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
          <p className="text-slate-400 text-sm">Aucune intervention dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((i) => (
            <Link
              key={i.id}
              href={`/technicien/interventions/${i.id}`}
              className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 hover:border-sky-200 transition-colors"
            >
              <div className="flex-shrink-0 min-w-[52px] text-center">
                <p className="text-xs font-medium text-slate-500 capitalize">{formatDate(i.scheduledAt)}</p>
                <p className="text-sm font-bold text-slate-900">{formatTime(i.scheduledAt)}</p>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{i.clientName ?? "—"}</p>
                <p className="text-slate-400 text-xs truncate">{TYPE_LABELS[i.type] ?? i.type}</p>
              </div>
              <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[i.status] ?? "bg-slate-50 text-slate-400 border-slate-100"}`}>
                {i.status}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
