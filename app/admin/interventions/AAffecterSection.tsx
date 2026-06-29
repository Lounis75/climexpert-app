"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Inbox, MapPin, ChevronRight } from "lucide-react";
import { TYPE_LABELS, TYPE_COLORS } from "@/lib/interventions-ui";

export type AAffecterItem = {
  id: string; clientName: string; type: string;
  address: string | null; scheduledAt: string | null; dureeMin: number | null;
};

const SELECT = "text-sm bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-2 text-white focus:outline-none focus:border-sky-500/50";

function dureeTxt(m: number) { return m % 60 === 0 ? `${m / 60} h` : `${Math.floor(m / 60)} h ${m % 60}`; }

function AffecterCard({ item, techniciens }: { item: AAffecterItem; techniciens: { id: string; name: string }[] }) {
  const router = useRouter();
  const [tech, setTech] = useState("");
  const [when, setWhen] = useState("");
  const [busy, setBusy] = useState(false);
  const hasDate = !!item.scheduledAt;
  const cfg = TYPE_COLORS[item.type] ?? TYPE_COLORS.autre;

  async function affecter() {
    if (!tech) { alert("Choisis un technicien à affecter."); return; }
    if (!hasDate && !when) { alert("Choisis une date d'intervention."); return; }
    setBusy(true);
    try {
      const body: Record<string, unknown> = { action: "planifier", technicienId: tech };
      if (!hasDate && when) body.scheduledAt = new Date(when).toISOString();
      const res = await fetch(`/api/admin/interventions/${item.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!res.ok) { alert("L'affectation a échoué, réessayez."); return; }
      router.refresh();
    } catch { alert("Erreur réseau, réessayez."); }
    finally { setBusy(false); }
  }

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-white font-semibold text-sm">{item.clientName}</span>
            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg}`}>{TYPE_LABELS[item.type] ?? item.type}</span>
          </div>
          <p className="text-slate-400 text-xs mt-1 flex items-center gap-1.5"><MapPin className="w-3 h-3 flex-shrink-0" />{item.address ?? "Adresse à préciser"}</p>
          <p className="text-slate-500 text-xs mt-0.5">
            {hasDate
              ? `Créneau provisoire : ${new Date(item.scheduledAt!).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
              : "Date à définir"}
            {item.dureeMin ? ` · ${dureeTxt(item.dureeMin)}` : ""}
          </p>
        </div>
        <Link href={`/admin/interventions/${item.id}`} title="Ouvrir la fiche" className="text-slate-500 hover:text-white flex-shrink-0"><ChevronRight className="w-5 h-5" /></Link>
      </div>

      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <select value={tech} onChange={(e) => setTech(e.target.value)} className={SELECT}>
          <option value="" className="bg-slate-800">Technicien…</option>
          {techniciens.map((t) => <option key={t.id} value={t.id} className="bg-slate-800">{t.name}</option>)}
        </select>
        {!hasDate && (
          <input type="datetime-local" step={1800} value={when} onChange={(e) => setWhen(e.target.value)} className={`${SELECT} [color-scheme:dark]`} />
        )}
        <button onClick={affecter} disabled={busy} className="px-3.5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
          {busy ? "…" : "Affecter"}
        </button>
      </div>
    </div>
  );
}

/** Boîte « À affecter » : devis gagnés (interventions sans technicien) en attente d'attribution.
 *  C'est le pont entre la fin du commercial et le début de la production. */
export default function AAffecterSection({ items, techniciens }: { items: AAffecterItem[]; techniciens: { id: string; name: string }[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mb-7">
      <div className="flex items-center gap-2">
        <Inbox className="w-4 h-4 text-amber-400" />
        <h2 className="text-amber-400 text-xs font-bold uppercase tracking-wide">À affecter ({items.length})</h2>
      </div>
      <p className="text-slate-500 text-xs mt-1 mb-3">Devis gagnés en attente d&apos;un technicien. Assigne pour les faire passer en production.</p>
      <div className="space-y-2.5">
        {items.map((it) => <AffecterCard key={it.id} item={it} techniciens={techniciens} />)}
      </div>
    </section>
  );
}
