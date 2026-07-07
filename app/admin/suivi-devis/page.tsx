import AdminHeader from "@/components/AdminHeader";
import { db } from "@/lib/db";
import { leads, devisEnvois } from "@/lib/db/schema";
import { and, isNull, isNotNull, inArray, desc } from "drizzle-orm";
import Link from "next/link";
import { FileText, Clock, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import ModifierDevisButton from "./ModifierDevisButton";

export const dynamic = "force-dynamic";

const euros = (ct?: number | null) => (ct ? `${(ct / 100).toLocaleString("fr-FR")} €` : "—");
const fmt = (d?: Date | string | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—");
const PROJECT: Record<string, string> = { installation: "Installation", entretien: "Entretien", depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Autre" };

export default async function SuiviDevisPage() {
  const [enAttente, finalises] = await Promise.all([
    db.select({ id: leads.id, name: leads.name, clientId: leads.clientId, project: leads.project, montantDevisCt: leads.montantDevisCt, devisEnvoyeLe: leads.devisEnvoyeLe, devisUrl: leads.devisUrl })
      .from(leads)
      .where(and(isNotNull(leads.devisEnvoyeLe), isNull(leads.devisDecision), isNull(leads.supprimeLe)))
      .orderBy(desc(leads.devisEnvoyeLe)),
    db.select({ id: leads.id, name: leads.name, clientId: leads.clientId, project: leads.project, montantDevisCt: leads.montantDevisCt, devisDecision: leads.devisDecision, devisDecisionLe: leads.devisDecisionLe, devisMotifRefus: leads.devisMotifRefus, devisUrl: leads.devisUrl })
      .from(leads)
      .where(and(inArray(leads.devisDecision, ["accepte", "refuse"]), isNull(leads.supprimeLe)))
      .orderBy(desc(leads.devisDecisionLe))
      .limit(50),
  ]);

  // Dernier envoi AVEC instantané de chiffrage par prospect : permet « Modifier » (rouvre l'outil
  // pré-rempli ; les envois sans instantané, PDF déposé à la main, n'ont pas ce bouton).
  const allIds = [...new Set([...enAttente.map((l) => l.id), ...finalises.map((l) => l.id)])];
  const envois = allIds.length
    ? await db.select({ id: devisEnvois.id, leadId: devisEnvois.leadId })
        .from(devisEnvois)
        .where(and(inArray(devisEnvois.leadId, allIds), isNotNull(devisEnvois.chiffrage)))
        .orderBy(desc(devisEnvois.createdAt))
    : [];
  const envoiByLead = new Map<string, string>();
  for (const e of envois) if (!envoiByLead.has(e.leadId)) envoiByLead.set(e.leadId, e.id);

  const totalAttente = enAttente.reduce((s, l) => s + (l.montantDevisCt ?? 0), 0);
  const acceptes = finalises.filter((l) => l.devisDecision === "accepte");
  const totalAcceptes = acceptes.reduce((s, l) => s + (l.montantDevisCt ?? 0), 0);

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Devis</h1>
          <p className="text-slate-400 text-sm">Suivi des devis envoyés aux clients : en attente de réponse et finalisés.</p>
        </div>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-amber-400 flex items-center gap-2"><Clock className="w-4 h-4" /> En attente de réponse ({enAttente.length})</h2>
            {totalAttente > 0 && <span className="text-slate-500 text-xs">{euros(totalAttente)}</span>}
          </div>
          {enAttente.length === 0 ? (
            <p className="bg-slate-800/40 border border-white/8 rounded-2xl p-8 text-center text-slate-500 text-sm">Aucun devis en attente.</p>
          ) : (
            <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/5">
              {enAttente.map((l) => (
                <div key={l.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-violet-400" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{l.name}</p>
                    <p className="text-slate-500 text-xs">{l.project ? (PROJECT[l.project] ?? l.project) : "Devis"} · envoyé le {fmt(l.devisEnvoyeLe)}</p>
                  </div>
                  <span className="text-slate-300 text-sm font-semibold tabular-nums flex-shrink-0">{euros(l.montantDevisCt)}</span>
                  {envoiByLead.has(l.id) && <ModifierDevisButton leadId={l.id} envoiId={envoiByLead.get(l.id)!} />}
                  {l.devisUrl && <a href={l.devisUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 text-xs font-medium flex-shrink-0">PDF</a>}
                  <Link href={l.clientId ? `/admin/clients/${l.clientId}` : `/admin/leads?lead=${l.id}`} title={l.clientId ? "Ouvrir la fiche client" : "Ouvrir la fiche prospect"} className="text-slate-500 hover:text-white flex-shrink-0"><ArrowRight className="w-4 h-4" /></Link>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-emerald-400 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Finalisés ({finalises.length})</h2>
            <span className="text-slate-500 text-xs">{acceptes.length} accepté{acceptes.length > 1 ? "s" : ""} · {euros(totalAcceptes)}</span>
          </div>
          {finalises.length === 0 ? (
            <p className="bg-slate-800/40 border border-white/8 rounded-2xl p-8 text-center text-slate-500 text-sm">Aucun devis finalisé.</p>
          ) : (
            <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/5">
              {finalises.map((l) => {
                const ok = l.devisDecision === "accepte";
                return (
                  <div key={l.id} className="flex items-center gap-4 px-5 py-4">
                    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${ok ? "bg-emerald-500/10 border-emerald-500/20" : "bg-red-500/10 border-red-500/20"}`}>{ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{l.name}</p>
                      <p className="text-slate-500 text-xs truncate">{ok ? "Accepté" : "Décliné"} le {fmt(l.devisDecisionLe)}{!ok && l.devisMotifRefus ? ` · ${l.devisMotifRefus}` : ""}</p>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums flex-shrink-0 ${ok ? "text-emerald-300" : "text-slate-500"}`}>{euros(l.montantDevisCt)}</span>
                    {envoiByLead.has(l.id) && <ModifierDevisButton leadId={l.id} envoiId={envoiByLead.get(l.id)!} />}
                    {l.devisUrl && <a href={l.devisUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 text-xs font-medium flex-shrink-0">PDF</a>}
                    <Link href={l.clientId ? `/admin/clients/${l.clientId}` : `/admin/leads?lead=${l.id}`} title={l.clientId ? "Ouvrir la fiche client" : "Ouvrir la fiche prospect"} className="text-slate-500 hover:text-white flex-shrink-0"><ArrowRight className="w-4 h-4" /></Link>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
