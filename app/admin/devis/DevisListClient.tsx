"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, ArrowRight, Calendar, Search, X } from "lucide-react";
import { centimesToEuros, STATUS_DEVIS } from "@/lib/devis";

type DevisRow = {
  id: string;
  number: string;
  clientName: string | null;
  status: string;
  totalTtcCt: number;
  createdAt: Date | string;
};

export default function DevisListClient({ devisList }: { devisList: DevisRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = devisList.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.number.toLowerCase().includes(q) ||
      (d.clientName ?? "").toLowerCase().includes(q)
    );
  });

  if (devisList.length === 0) {
    return (
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-5 h-5 text-sky-400" />
        </div>
        <h2 className="text-white font-semibold mb-2">Aucun devis</h2>
        <p className="text-slate-400 text-sm mb-6">Créez votre premier devis en cliquant sur le bouton ci-dessus.</p>
        <Link
          href="/admin/devis/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-all"
        >
          Nouveau devis
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Numéro ou client…"
          className="w-full pl-9 pr-8 py-2 rounded-xl border border-white/10 bg-slate-800/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_1.5fr_130px_120px_100px_32px] gap-4 px-5 py-3 text-xs text-slate-500 border-b border-white/8">
          <span>Numéro</span>
          <span>Client</span>
          <span>Statut</span>
          <span>Total TTC</span>
          <span>Date</span>
          <span />
        </div>

        {filtered.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-10">Aucun devis pour cette recherche.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((d) => {
              const status = STATUS_DEVIS[d.status] ?? STATUS_DEVIS.brouillon;
              return (
                <Link
                  key={d.id}
                  href={`/admin/devis/${d.id}`}
                  className="grid sm:grid-cols-[1fr_1.5fr_130px_120px_100px_32px] grid-cols-1 gap-4 px-5 py-4 items-center hover:bg-white/3 transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-white text-sm font-medium">{d.number}</span>
                  </div>
                  <span className="text-slate-300 text-sm truncate">{d.clientName}</span>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border w-fit ${status.color}`}>
                    {status.label}
                  </span>
                  <span className="text-white text-sm tabular-nums font-medium">
                    {centimesToEuros(d.totalTtcCt)}
                  </span>
                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors justify-self-center" />
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-slate-600 text-xs text-center mt-6">
        {filtered.length} / {devisList.length} devis
      </p>
    </div>
  );
}
