import AdminHeader from "@/components/AdminHeader";
import Link from "next/link";
import { ClipboardCheck, ChevronRight, Camera, CheckCircle2, XCircle, Clock } from "lucide-react";
import { getRevuesEnAttente, getRevues, type Revue } from "@/lib/revues";

export const dynamic = "force-dynamic";

function quand(d: Date | string | null) {
  if (!d) return "";
  return new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).replace(":", "h");
}
function clientNom(r: Revue) {
  const c = (r.clientSnapshot ?? {}) as Record<string, string>;
  return c.nom?.trim() || "Client";
}

function Ligne({ r }: { r: Revue }) {
  const nbPhotos = (r.photosUrls ?? []).length;
  return (
    <Link href={`/admin/revues/${r.id}`} className="flex items-center justify-between gap-3 bg-slate-800/40 border border-white/8 rounded-xl p-4 hover:border-sky-500/40 transition-colors">
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white font-semibold text-sm">{clientNom(r)}</span>
          {r.status === "en_attente" && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/40 flex items-center gap-1"><Clock className="w-3 h-3" /> En attente</span>}
          {r.status === "validee" && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Validé, envoyé</span>}
          {r.status === "annulee" && <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-white/10 flex items-center gap-1"><XCircle className="w-3 h-3" /> Annulé</span>}
        </div>
        <p className="text-slate-400 text-xs mt-1 truncate">{r.description || "Devis"} · demandé par {r.demandeParNom ?? "?"} · {quand(r.createdAt)}</p>
        <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1"><Camera className="w-3 h-3" /> {nbPhotos} photo{nbPhotos > 1 ? "s" : ""}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-500 flex-shrink-0" />
    </Link>
  );
}

export default async function RevuesPage() {
  const [enAttente, toutes] = await Promise.all([getRevuesEnAttente(), getRevues(60)]);
  const traitees = toutes.filter((r) => r.status !== "en_attente");
  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2"><ClipboardCheck className="w-6 h-6 text-sky-400" /> Avis d&apos;expert sur devis</h1>
          <p className="text-slate-400 text-sm">Devis en attente de relecture avant envoi au client. Vérifie les lignes et les photos, puis valide (envoi au client) ou annule.</p>
        </div>

        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">En attente ({enAttente.length})</p>
        <div className="space-y-2.5 mb-8">
          {enAttente.length === 0 && <p className="text-slate-500 text-sm">Aucune demande en attente.</p>}
          {enAttente.map((r) => <Ligne key={r.id} r={r} />)}
        </div>

        {traitees.length > 0 && (
          <>
            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">Historique</p>
            <div className="space-y-2.5">
              {traitees.map((r) => <Ligne key={r.id} r={r} />)}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
