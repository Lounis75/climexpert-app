import AdminHeader from "@/components/AdminHeader";
import { getClientActivity } from "@/lib/clients";
import { db } from "@/lib/db";
import { leads, techniciens, contratsEntretien, documents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { centimesToEuros } from "@/lib/devis";
import { getChantiersByClient } from "@/lib/chantiers";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Calendar,
  Wrench, FileText, ScrollText, HardHat,
  HeadphonesIcon, Bell, CheckCircle2, Clock, XCircle, Shield, Euro, ExternalLink, Building2, UserCircle,
} from "lucide-react";
import RgpdButtons from "./RgpdButtons";
import ClientContactCard from "./ClientContactCard";
import SendPortalAccess from "./SendPortalAccess";
import NouveauDevisModal from "@/components/NouveauDevisModal";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Autre",
};

const INTERV_STATUS: Record<string, { label: string; color: string }> = {
  planifiée: { label: "Planifiée",  color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  en_cours:  { label: "En cours",   color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  terminée:  { label: "Terminée",   color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  annulée:   { label: "Annulée",    color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
};

const SAV_STATUS: Record<string, { label: string; color: string }> = {
  ouvert:    { label: "Ouvert",    color: "bg-red-500/10 text-red-400 border-red-500/30" },
  en_cours:  { label: "En cours",  color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  résolu:    { label: "Résolu",    color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  fermé:     { label: "Fermé",     color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
};

const SUIVI_LABELS: Record<string, string> = { j7: "J+7", j30: "J+30", j365: "J+365" };
const SUIVI_CANAL: Record<string, string>  = { email: "Email", sms: "SMS" };

function fmt(d: Date | string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtFull(d: Date | string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

type TimelineItem = {
  date: Date; type: "intervention" | "sav" | "suivi";
  label: string; sub: string; href?: string; color: string; icon: string;
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await getClientActivity(id);
  if (!c) notFound();

  // Commercial affecté + montant du deal : résolus via le prospect (lead) d'origine
  let commercial: string | null = null;
  let leadMontantCt = 0;
  if (c.leadId) {
    const [lead] = await db.select({ commercialId: leads.commercialId, montantDevisCt: leads.montantDevisCt }).from(leads).where(eq(leads.id, c.leadId)).limit(1);
    if (lead) {
      leadMontantCt = lead.montantDevisCt ?? 0;
      if (lead.commercialId) {
        const [tech] = await db.select({ name: techniciens.name, prenom: techniciens.prenom }).from(techniciens).where(eq(techniciens.id, lead.commercialId)).limit(1);
        if (tech) commercial = tech.prenom ? `${tech.prenom} ${tech.name}` : tech.name;
      }
    }
  }

  // Contrat d'entretien du client (le plus récent)
  const [contrat] = await db.select().from(contratsEntretien)
    .where(eq(contratsEntretien.clientId, c.id))
    .orderBy(desc(contratsEntretien.createdAt))
    .limit(1);

  // Montant généré = montant du deal / des interventions uniquement. On N'ajoute PAS le contrat
  // d'entretien : pour un entretien, c'est le même argent que le deal -> évite le double comptage
  // (le suivi de facturation réel vit dans le logiciel compta, hors CRM).
  const montantGenere = leadMontantCt;

  // Documents du client (attestations CERFA, etc.)
  const docs = await db.select().from(documents)
    .where(eq(documents.clientId, c.id))
    .orderBy(desc(documents.createdAt));

  // Chantiers du client (projets multi-interventions)
  const chantiersList = await getChantiersByClient(c.id);

  // Build unified timeline (interventions / SAV / suivis, pas de devis/factures)
  const timeline: TimelineItem[] = [
    ...c.interventionsList.map((i) => ({
      date: new Date(i.scheduledAt ?? i.createdAt), type: "intervention" as const,
      label: TYPE_LABELS[i.type] ?? i.type, sub: `${INTERV_STATUS[i.status]?.label ?? i.status}${i.address ? ` · ${i.address}` : ""}`,
      href: `/admin/interventions/${i.id}`, color: "bg-violet-500/10 border-violet-500/30 text-violet-400", icon: "🔧",
    })),
    ...c.savList.map((s) => ({
      date: new Date(s.createdAt), type: "sav" as const,
      label: `SAV : ${s.subject}`, sub: SAV_STATUS[s.status]?.label ?? s.status,
      color: "bg-red-500/10 border-red-500/30 text-red-400", icon: "🎧",
    })),
    ...c.suivisList.filter((s) => s.statut === "envoye").map((s) => ({
      date: new Date(s.dateEnvoi ?? s.datePrevue), type: "suivi" as const,
      label: `Suivi ${SUIVI_LABELS[s.typeSuivi] ?? s.typeSuivi}`, sub: `${SUIVI_CANAL[s.canal] ?? s.canal} · Envoyé`,
      color: "bg-amber-500/10 border-amber-500/30 text-amber-400", icon: "📬",
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  const pendingSuivis = c.suivisList.filter((s) => s.statut === "planifie");

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/admin/clients" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-bold text-white">{c.name}</h1>
              {c.typeClient === "professionnel" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-semibold text-[11px]"><Building2 className="w-3 h-3" /> Professionnel</span>
              ) : c.typeClient === "sous_traitance" ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 font-semibold text-[11px]"><HardHat className="w-3 h-3" /> Sous-traitance</span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 font-semibold text-[11px]"><UserCircle className="w-3 h-3" /> Particulier</span>
              )}
            </div>
            {c.typeClient === "professionnel" && (c.representant || c.siret) && (
              <p className="text-slate-400 text-xs mt-1">
                {c.representant && <>Contact : <span className="text-slate-200">{c.representant}{c.representantQualite ? `, ${c.representantQualite}` : ""}</span></>}
                {c.representant && c.siret ? " · " : ""}
                {c.siret && <>SIRET : <span className="text-slate-200">{c.siret}</span></>}
              </p>
            )}
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {c.clientToken && (
                <Link href={`/suivi/${c.clientToken}`} target="_blank" className="text-xs text-sky-500 hover:text-sky-400 underline underline-offset-2">
                  Portail client →
                </Link>
              )}
              <SendPortalAccess clientId={c.id} hasEmail={!!c.email} />
              <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                <span className="text-slate-500">Commercial :</span>
                {commercial ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 font-medium">
                    {commercial}
                  </span>
                ) : (
                  <span className="text-slate-500 italic">non affecté</span>
                )}
              </span>
              {/* Contrat d'entretien */}
              {c.contratEntretienId ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium text-xs">
                  <Shield className="w-3 h-3" /> Sous contrat d&apos;entretien
                </span>
              ) : (
                <span className="text-xs text-slate-500">Sans contrat d&apos;entretien</span>
              )}
              {/* Prochain entretien à relancer */}
              {c.prochainEntretienLe && (
                <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                  <Wrench className="w-3 h-3" /> Prochain entretien : {fmtFull(c.prochainEntretienLe)}
                </span>
              )}
            </div>
          </div>
          {/* Un client peut avoir plusieurs interventions / devis (vente d'une prestation en plus…). */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <NouveauDevisModal presetClient={{ id: c.id, name: c.name }} triggerClassName="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold transition-colors" />
          <Link href={`/admin/interventions/new?client=${c.id}`}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors flex-shrink-0">
            <Wrench className="w-4 h-4" /> Nouvelle intervention
          </Link>
          </div>
        </div>

        {/* Coordonnées */}
        <ClientContactCard
          clientId={c.id}
          name={c.name}
          phone={c.phone}
          email={c.email}
          address={c.address}
          city={c.city}
        />

        {/* KPIs */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/40 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{c.interventionsList.filter(i => i.status === "terminée").length}</p>
            <p className="text-slate-400 text-xs mt-0.5">Interventions</p>
          </div>
          <div className="bg-slate-800/40 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{c.savList.filter(s => s.status === "ouvert" || s.status === "en_cours").length}</p>
            <p className="text-slate-400 text-xs mt-0.5">SAV ouverts</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-400">{centimesToEuros(montantGenere)}</p>
            <p className="text-emerald-600/90 text-xs mt-0.5">Montant généré</p>
          </div>
        </div>

        {/* Contrat d'entretien */}
        {contrat && (
          <div className="bg-emerald-500/[0.06] border border-emerald-500/20 rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <h2 className="text-white font-semibold text-sm flex items-center gap-2 mb-2">
                  <ScrollText className="w-4 h-4 text-emerald-400" /> Contrat d&apos;entretien
                  {contrat.numero && <span className="text-emerald-300/80 text-[10px] font-mono bg-emerald-500/10 border border-emerald-500/20 rounded px-1.5 py-0.5">{contrat.numero}</span>}
                  {!contrat.active && <span className="text-slate-400 text-[10px] bg-slate-500/10 border border-white/10 rounded px-1.5 py-0.5">Inactif</span>}
                </h2>
                <div className="flex items-center gap-4 flex-wrap text-xs text-slate-300">
                  <span className="flex items-center gap-1.5"><Euro className="w-3 h-3 text-emerald-400" /> {centimesToEuros(contrat.prixUnitaireCt)} / an · {contrat.units} unité{contrat.units > 1 ? "s" : ""}</span>
                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-slate-500" /> Début : {fmt(contrat.startDate)}</span>
                  <span className="flex items-center gap-1.5">
                    <Wrench className="w-3 h-3 text-slate-500" /> Prochaine visite : {contrat.nextVisit ? fmt(contrat.nextVisit) : "non planifiée"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a href={`/api/admin/contrats/${contrat.id}/document`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs font-medium hover:bg-sky-500/20 transition-colors">
                  <FileText className="w-3.5 h-3.5" /> Contrat PDF
                </a>
                <Link href="/admin/contrats"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700/60 border border-white/10 text-slate-300 text-xs font-medium hover:text-white transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" /> Gérer
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Équipement */}
        {(c.equipementInstalle || c.marqueModele || c.dateInstallation || c.garantieExpireLe) && (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-slate-500" /> Équipement installé
            </h2>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              {c.equipementInstalle && (
                <div><p className="text-xs text-slate-500 mb-1">Équipement</p><p className="text-white">{c.equipementInstalle}</p></div>
              )}
              {c.marqueModele && (
                <div><p className="text-xs text-slate-500 mb-1">Marque / modèle</p><p className="text-white">{c.marqueModele}</p></div>
              )}
              {c.dateInstallation && (
                <div><p className="text-xs text-slate-500 mb-1">Date d&apos;installation</p><p className="text-white">{fmt(c.dateInstallation)}</p></div>
              )}
              {c.garantieExpireLe && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">Garantie expire le</p>
                  <p className={`font-medium ${new Date(c.garantieExpireLe) < new Date() ? "text-red-400" : "text-emerald-400"}`}>
                    {fmt(c.garantieExpireLe)}
                    {new Date(c.garantieExpireLe) < new Date()
                      ? <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30">Expirée</span>
                      : <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30">Active</span>
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Suivis planifiés */}
        {pendingSuivis.length > 0 && (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-400" />
              <h2 className="text-white font-semibold text-sm">Suivis à venir ({pendingSuivis.length})</h2>
            </div>
            <div className="divide-y divide-white/5">
              {pendingSuivis.map((s) => {
                const isPast = new Date(s.datePrevue) < new Date();
                return (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3 gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        {SUIVI_LABELS[s.typeSuivi] ?? s.typeSuivi}
                      </span>
                      <span className="text-slate-300 text-sm">{SUIVI_CANAL[s.canal] ?? s.canal}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {isPast
                        ? <span className="flex items-center gap-1 text-red-400"><XCircle className="w-3 h-3" /> En retard</span>
                        : <span className="flex items-center gap-1 text-slate-400"><Clock className="w-3 h-3" /> {fmtFull(s.datePrevue)}</span>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SAV */}
        {c.savList.length > 0 && (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
              <HeadphonesIcon className="w-4 h-4 text-red-400" />
              <h2 className="text-white font-semibold text-sm">SAV ({c.savList.length})</h2>
            </div>
            <div className="divide-y divide-white/5">
              {c.savList.map((s) => {
                const st = SAV_STATUS[s.status] ?? SAV_STATUS.ouvert;
                return (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3 gap-3">
                    <div>
                      <p className="text-white text-sm">{s.subject}</p>
                      {s.description && <p className="text-slate-500 text-xs mt-0.5 truncate max-w-xs">{s.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                      <span className="text-slate-500 text-xs">{fmt(s.createdAt)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline enrichie */}
        {timeline.length > 0 && (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <h2 className="text-white font-semibold text-sm">Historique complet</h2>
            </div>
            <div className="px-5 py-4 space-y-3">
              {timeline.map((item, idx) => (
                <div key={idx} className="flex gap-4 items-start">
                  <div className="flex flex-col items-center">
                    <span className="text-lg leading-none">{item.icon}</span>
                    {idx < timeline.length - 1 && <div className="w-px flex-1 bg-white/5 mt-2 min-h-[16px]" />}
                  </div>
                  <div className="flex-1 min-w-0 pb-3">
                    {item.href ? (
                      <Link href={item.href} className="text-white text-sm font-medium hover:text-sky-400 transition-colors">
                        {item.label}
                      </Link>
                    ) : (
                      <p className="text-white text-sm font-medium">{item.label}</p>
                    )}
                    <p className="text-slate-500 text-xs mt-0.5">{item.sub}</p>
                    <p className="text-slate-600 text-[10px] mt-0.5">{fmtFull(item.date)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${item.color}`}>
                    {item.type === "intervention" ? "Intervention" : item.type === "sav" ? "SAV" : "Suivi"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Chantiers (projets multi-interventions) */}
        {chantiersList.length > 0 && (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
              <HardHat className="w-4 h-4 text-amber-400" />
              <h2 className="text-white font-semibold text-sm">Chantiers ({chantiersList.length})</h2>
            </div>
            <div className="divide-y divide-white/5">
              {chantiersList.map((ch) => {
                const chInterv = c.interventionsList.filter((i) => i.chantierId === ch.id);
                return (
                  <div key={ch.id} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                      <span className="text-white font-medium text-sm flex items-center gap-2">
                        {ch.nom}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ch.statut === "termine" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-sky-500/10 text-sky-400 border-sky-500/30"}`}>
                          {ch.statut === "termine" ? "Terminé" : "En cours"}
                        </span>
                      </span>
                      {ch.montantCt != null && ch.montantCt > 0 && <span className="text-emerald-400 text-sm font-semibold">{centimesToEuros(ch.montantCt)}</span>}
                    </div>
                    {chInterv.length > 0 ? (
                      <div className="space-y-1">
                        {chInterv.map((i) => {
                          const st = INTERV_STATUS[i.status] ?? INTERV_STATUS.planifiée;
                          return (
                            <Link key={i.id} href={`/admin/interventions/${i.id}`} className="flex items-center justify-between gap-3 text-xs hover:bg-white/3 rounded-lg px-2 py-1.5 -mx-2 transition-colors">
                              <span className="text-slate-300 flex items-center gap-2">
                                {TYPE_LABELS[i.type] ?? i.type}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                              </span>
                              <span className="text-slate-500">{fmt(i.scheduledAt)}</span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-slate-600 text-xs">Aucune intervention rattachée pour l&apos;instant.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Interventions detail (hors chantier) */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-500" />
            <h2 className="text-white font-semibold text-sm">Interventions {chantiersList.length > 0 ? "(hors chantier)" : ""} ({c.interventionsList.filter((i) => !i.chantierId).length})</h2>
          </div>
          {c.interventionsList.filter((i) => !i.chantierId).length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-8">Aucune intervention{chantiersList.length > 0 ? " hors chantier" : ""}</p>
          ) : (
            <div className="divide-y divide-white/5">
              {c.interventionsList.filter((i) => !i.chantierId).map((i) => {
                const st = INTERV_STATUS[i.status] ?? INTERV_STATUS.planifiée;
                return (
                  <Link
                    key={i.id}
                    href={`/admin/interventions/${i.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white text-sm font-medium">{TYPE_LABELS[i.type] ?? i.type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-xs">
                      {i.address && (
                        <span className="flex items-center gap-1 max-w-[150px] truncate">
                          <MapPin className="w-3 h-3 flex-shrink-0" />{i.address}
                        </span>
                      )}
                      {i.scheduledAt && (
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmt(i.scheduledAt)}</span>
                      )}
                      {i.status === "terminée" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Documents (attestations CERFA…) */}
        {docs.length > 0 && (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <h2 className="text-white font-semibold text-sm">Documents ({docs.length})</h2>
            </div>
            <div className="divide-y divide-white/5">
              {docs.map((d) => (
                <a key={d.id} href={d.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors gap-3 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-sky-400" />
                    </span>
                    <span className="text-white text-sm truncate group-hover:text-sky-300 transition-colors">{d.label ?? "Document"}</span>
                  </div>
                  <span className="text-slate-500 text-xs flex-shrink-0">{fmt(d.createdAt)}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Notes internes */}
        {c.notes && (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
            <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" /> Notes internes
            </h2>
            <p className="text-slate-400 text-sm whitespace-pre-wrap">{c.notes}</p>
          </div>
        )}

        {/* RGPD */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
          <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-slate-500" /> RGPD
          </h2>
          <RgpdButtons clientId={c.id} />
          <p className="text-slate-600 text-xs mt-3">Conformément au RGPD, vous pouvez exporter ou supprimer toutes les données personnelles de ce client.</p>
        </div>

      </main>
    </div>
  );
}
