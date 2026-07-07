import AdminHeader from "@/components/AdminHeader";
import { getDevisById, centimesToEuros, STATUS_DEVIS } from "@/lib/devis";
import { db } from "@/lib/db";
import { interventions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, FileText, Trash2, Download, Wrench, ArrowRight, CalendarPlus, Pencil } from "lucide-react";
import DevisActions from "./DevisActions";
import SendEmailButton from "./SendEmailButton";
import ReviserButton from "./ReviserButton";
import CopyLinkButton from "./CopyLinkButton";
import CopyableContact from "@/components/CopyableContact";
import DeleteDevisButton from "./DeleteDevisButton";

export const dynamic = "force-dynamic";

export default async function DevisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const d = await getDevisById(id);
  if (!d) notFound();

  const status = STATUS_DEVIS[d.status] ?? STATUS_DEVIS.brouillon;

  const totalHt = d.lignes.reduce((s, l) => s + l.quantite * l.prixUnitaireCt, 0);
  const totalTva = d.lignes.reduce((s, l) => {
    const ht = l.quantite * l.prixUnitaireCt;
    return s + Math.round(ht * (Number(l.tvaRate) / 100));
  }, 0);
  const totalTtc = totalHt + totalTva;

  // Intervention liée (créée automatiquement à la signature du devis).
  const [interv] = await db
    .select({ id: interventions.id, status: interventions.status, scheduledAt: interventions.scheduledAt, technicienId: interventions.technicienId })
    .from(interventions)
    .where(eq(interventions.devisId, d.id))
    .limit(1);

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/admin/devis" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white">{d.number}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-0.5">
                Créé le {new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Modifier : interdit sur un devis accepté (signé) → bouton de RÉVISION à la place
                (nouveau devis pré-rempli, à ajuster puis faire signer ; ex. prix qui change après
                la visite technique). */}
            {d.status !== "accepté" ? (
              <Link
                href={`/admin/devis/${d.id}/modifier`}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/60 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-xs font-medium rounded-xl transition-all"
              >
                <Pencil className="w-3.5 h-3.5" /> Modifier
              </Link>
            ) : (
              <ReviserButton devisId={d.id} />
            )}
            {d.publicToken && <CopyLinkButton token={d.publicToken} />}
            <a
              href={`/api/admin/devis/${d.id}/pdf`}
              download={`${d.number}.pdf`}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-700/60 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-xs font-medium rounded-xl transition-all"
            >
              <Download className="w-3.5 h-3.5" /> PDF
            </a>
            <SendEmailButton devisId={d.id} clientEmail={d.clientEmail ?? null} />
            <DevisActions
              id={d.id}
              currentStatus={d.status}
              currentHtEuros={(d.totalHtCt ?? totalHt) / 100}
              currentTtcEuros={(d.totalTtcCt ?? totalTtc) / 100}
              currentFichierUrl={d.fichierUrl}
            />
          </div>
        </div>

        {/* Infos */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
            <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500">Client</p>
              <p className="text-white text-sm font-medium">{d.clientName}</p>
            </div>
          </div>

          {/* Contact copiable (email + téléphone) */}
          <CopyableContact email={d.clientEmail} phone={d.clientPhone} />
          {d.fichierUrl && (
            <a href={d.fichierUrl} target="_blank" rel="noopener noreferrer"
              className="bg-slate-800/40 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-emerald-500/40 transition-colors group">
              <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Devis joint</p>
                <p className="text-emerald-300 text-sm font-medium group-hover:text-white transition-colors">Ouvrir le PDF</p>
              </div>
            </a>
          )}
          {d.validUntil && (
            <div className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Valable jusqu&apos;au</p>
                <p className="text-white text-sm font-medium">
                  {new Date(d.validUntil).toLocaleDateString("fr-FR")}
                </p>
              </div>
            </div>
          )}
          {d.description && (
            <div className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3 sm:col-span-3">
              <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Objet</p>
                <p className="text-white text-sm">{d.description}</p>
              </div>
            </div>
          )}
        </div>

        {/* Intervention liée (devis accepté → client + intervention créés) */}
        {(d.status === "accepté" || interv) && (
          interv ? (
            <Link href={`/admin/interventions/${interv.id}`}
              className="flex items-center gap-3 bg-emerald-500/[0.07] border border-emerald-500/25 rounded-2xl p-4 hover:border-emerald-500/40 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">Intervention {interv.scheduledAt ? "planifiée" : "à planifier"}</p>
                <p className="text-slate-400 text-xs">
                  {interv.scheduledAt
                    ? `Le ${new Date(interv.scheduledAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}${interv.technicienId ? "" : " · technicien à affecter"}`
                    : "Ouvrez l'intervention pour affecter un technicien et une date."}
                </p>
              </div>
              <span className="flex items-center gap-1 text-emerald-300 text-xs font-medium group-hover:text-white transition-colors flex-shrink-0">
                {interv.scheduledAt ? "Ouvrir" : <>Planifier <CalendarPlus className="w-3.5 h-3.5" /></>}
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ) : (
            <Link href={d.clientId ? `/admin/interventions/new?client=${d.clientId}` : "/admin/interventions/new"}
              className="flex items-center gap-3 bg-sky-500/[0.07] border border-sky-500/25 rounded-2xl p-4 hover:border-sky-500/40 transition-colors group">
              <div className="w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/25 text-sky-400 flex items-center justify-center flex-shrink-0">
                <CalendarPlus className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold">Créer l&apos;intervention</p>
                <p className="text-slate-400 text-xs">Planifiez l&apos;intervention pour ce client (date + technicien).</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors flex-shrink-0" />
            </Link>
          )
        )}

        {/* Lignes */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm">Lignes du devis</h2>
          </div>

          <div className="hidden sm:grid grid-cols-[2fr_60px_120px_60px_120px] gap-3 px-5 py-2 text-xs text-slate-500 border-b border-white/5">
            <span>Désignation</span>
            <span>Qté</span>
            <span>P.U. HT</span>
            <span>TVA</span>
            <span className="text-right">Total TTC</span>
          </div>

          <div className="divide-y divide-white/5">
            {d.lignes.map((l) => {
              const ht = l.quantite * l.prixUnitaireCt;
              const tva = Math.round(ht * (Number(l.tvaRate) / 100));
              const ttc = ht + tva;
              return (
                <div
                  key={l.id}
                  className="grid sm:grid-cols-[2fr_60px_120px_60px_120px] grid-cols-1 gap-2 px-5 py-3 items-center"
                >
                  <span className="text-white text-sm">{l.designation}</span>
                  <span className="text-slate-400 text-sm">{l.quantite}</span>
                  <span className="text-slate-300 text-sm tabular-nums">{centimesToEuros(l.prixUnitaireCt)}</span>
                  <span className="text-slate-400 text-sm">{String(l.tvaRate)}%</span>
                  <span className="text-right text-white text-sm font-medium tabular-nums">{centimesToEuros(ttc)}</span>
                </div>
              );
            })}
          </div>

          {/* Totaux */}
          <div className="border-t border-white/10 px-5 py-4 flex justify-end">
            <div className="w-64 space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total HT</span>
                <span className="text-white tabular-nums">{centimesToEuros(totalHt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">TVA</span>
                <span className="text-white tabular-nums">{centimesToEuros(totalTva)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold border-t border-white/10 pt-1.5 mt-1.5">
                <span className="text-white">Total TTC</span>
                <span className="text-sky-400 text-base tabular-nums">{centimesToEuros(totalTtc)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Delete zone */}
        <div className="flex justify-end">
          <DeleteDevisButton devisId={d.id} />
        </div>

      </main>
    </div>
  );
}
