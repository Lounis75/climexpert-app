"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, ArrowRight, Calendar, Search, X, Pencil, FilePlus2 } from "lucide-react";
import { centimesToEuros, STATUS_DEVIS } from "@/lib/devis";

type DevisRow = {
  id: string;
  number: string;
  clientName: string | null;
  status: string;
  totalTtcCt: number | null;
  createdAt: Date | string;
};

export default function DevisListClient({ devisList }: { devisList: DevisRow[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  // Devis accepté (signé) : jamais modifié directement, on crée une RÉVISION pré-remplie
  // (nouveau devis brouillon) qu'on ouvre aussitôt en modification.
  async function reviser(id: string) {
    if (!confirm("Ce devis est signé : créer un devis révisé ? L'original reste intact ; le nouveau reprend les mêmes lignes, à ajuster puis renvoyer pour une nouvelle signature.")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/devis/${id}/reviser`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (!res.ok || !d.devis?.id) { alert(d.error ?? "Révision impossible, réessayez."); return; }
      router.push(`/admin/devis/${d.devis.id}/modifier`);
    } catch {
      alert("Erreur réseau, réessayez.");
    } finally {
      setBusyId(null);
    }
  }

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
        <div className="hidden sm:grid grid-cols-[1fr_1.3fr_120px_110px_90px_110px_32px] gap-4 px-5 py-3 text-xs text-slate-500 border-b border-white/8">
          <span>Numéro</span>
          <span>Client</span>
          <span>Statut</span>
          <span>Total TTC</span>
          <span>Date</span>
          <span />
          <span />
        </div>

        {filtered.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-10">Aucun devis pour cette recherche.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((d) => {
              const status = STATUS_DEVIS[d.status] ?? STATUS_DEVIS.brouillon;
              return (
                <div
                  key={d.id}
                  onClick={() => router.push(`/admin/devis/${d.id}`)}
                  className="grid sm:grid-cols-[1fr_1.3fr_120px_110px_90px_110px_32px] grid-cols-1 gap-4 px-5 py-4 items-center hover:bg-white/3 transition-colors group cursor-pointer"
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
                  {/* Modifier (devis non signé) ou Réviser (devis accepté : nouveau devis pré-rempli) */}
                  {d.status === "accepté" ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); reviser(d.id); }}
                      disabled={busyId === d.id}
                      title="Devis signé : crée une révision pré-remplie à ajuster puis faire signer"
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 disabled:opacity-50 text-xs font-medium rounded-lg transition-all w-fit"
                    >
                      <FilePlus2 className="w-3 h-3" /> {busyId === d.id ? "…" : "Réviser"}
                    </button>
                  ) : (
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push(`/admin/devis/${d.id}/modifier`); }}
                      className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-700/60 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-xs font-medium rounded-lg transition-all w-fit"
                    >
                      <Pencil className="w-3 h-3" /> Modifier
                    </button>
                  )}
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors justify-self-center hidden sm:block" />
                </div>
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
