import AdminHeader from "@/components/AdminHeader";
import { getClientActivity } from "@/lib/clients";
import { centimesToEuros, STATUS_DEVIS } from "@/lib/devis";
import { STATUS_FACTURE } from "@/lib/factures";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, Calendar,
  ClipboardList, Receipt, Wrench, MessageSquare, FileText,
  HeadphonesIcon, Bell, CheckCircle2, Clock, XCircle, Shield,
} from "lucide-react";
import RgpdButtons from "./RgpdButtons";

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
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function fmtFull(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

type TimelineItem = {
  date: Date; type: "devis" | "facture" | "intervention" | "sav" | "suivi";
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

  const caTotal = c.facturesList
    .filter((f) => f.status === "payée")
    .reduce((s, f) => s + (f.totalTtcCt ?? 0), 0);

  // Build unified timeline
  const timeline: TimelineItem[] = [
    ...c.devisList.map((d) => ({
      date: new Date(d.createdAt), type: "devis" as const,
      label: `Devis ${d.number}`, sub: `${centimesToEuros(d.totalTtcCt ?? 0)} · ${STATUS_DEVIS[d.status]?.label ?? d.status}`,
      href: `/admin/devis/${d.id}`, color: "bg-sky-500/10 border-sky-500/30 text-sky-400", icon: "📋",
    })),
    ...c.facturesList.map((f) => ({
      date: new Date(f.createdAt), type: "facture" as const,
      label: `Facture ${f.number}`, sub: `${centimesToEuros(f.totalTtcCt ?? 0)} · ${STATUS_FACTURE[f.status]?.label ?? f.status}`,
      href: `/admin/factures/${f.id}`, color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400", icon: "🧾",
    })),
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
        <div className="flex items-start gap-3">
          <Link href="/admin/clients" className="text-slate-400 hover:text-white transition-colors mt-1">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{c.name}</h1>
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-slate-400">
              <a href={`tel:${c.phone}`} className="flex items-center gap-1.5 text-sky-400 hover:text-sky-300 transition-colors">
                <Phone className="w-3.5 h-3.5" /> {c.phone}
              </a>
              {c.email && (
                <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <Mail className="w-3.5 h-3.5" /> {c.email}
                </a>
              )}
              {c.city && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> {c.city}
                </span>
              )}
              {c.address && (
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> {c.address}
                </span>
              )}
            </div>
            {c.notes && (
              <p className="flex items-start gap-1.5 mt-2 text-slate-500 text-xs">
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {c.notes}
              </p>
            )}
            {c.clientToken && (
              <div className="mt-2">
                <Link href={`/suivi/${c.clientToken}`} target="_blank" className="text-xs text-sky-500 hover:text-sky-400 underline underline-offset-2">
                  Portail client →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/40 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{c.interventionsList.filter(i => i.status === "terminée").length}</p>
            <p className="text-slate-400 text-xs mt-0.5">Interventions</p>
          </div>
          <div className="bg-slate-800/40 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{c.facturesList.length}</p>
            <p className="text-slate-400 text-xs mt-0.5">Factures</p>
          </div>
          <div className="bg-slate-800/40 border border-white/8 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{c.savList.filter(s => s.status === "ouvert" || s.status === "en_cours").length}</p>
            <p className="text-slate-400 text-xs mt-0.5">SAV ouverts</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-2xl font-bold text-emerald-400">{centimesToEuros(caTotal)}</p>
            <p className="text-emerald-600 text-xs mt-0.5">CA encaissé</p>
          </div>
        </div>

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
                    {item.type === "devis" ? "Devis" : item.type === "facture" ? "Facture" : item.type === "intervention" ? "Intervention" : item.type === "sav" ? "SAV" : "Suivi"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interventions detail */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-500" />
            <h2 className="text-white font-semibold text-sm">Interventions ({c.interventionsList.length})</h2>
          </div>
          {c.interventionsList.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-8">Aucune intervention</p>
          ) : (
            <div className="divide-y divide-white/5">
              {c.interventionsList.map((i) => {
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

        {/* Devis */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-slate-500" />
            <h2 className="text-white font-semibold text-sm">Devis ({c.devisList.length})</h2>
          </div>
          {c.devisList.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-8">Aucun devis</p>
          ) : (
            <div className="divide-y divide-white/5">
              {c.devisList.map((d) => {
                const st = STATUS_DEVIS[d.status] ?? STATUS_DEVIS.brouillon;
                return (
                  <Link
                    key={d.id}
                    href={`/admin/devis/${d.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white text-sm font-medium">{d.number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 text-xs">
                      {d.totalTtcCt != null && <span className="text-white tabular-nums">{centimesToEuros(d.totalTtcCt)}</span>}
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmt(d.createdAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Factures */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
            <Receipt className="w-4 h-4 text-slate-500" />
            <h2 className="text-white font-semibold text-sm">Factures ({c.facturesList.length})</h2>
          </div>
          {c.facturesList.length === 0 ? (
            <p className="text-slate-500 text-xs text-center py-8">Aucune facture</p>
          ) : (
            <div className="divide-y divide-white/5">
              {c.facturesList.map((f) => {
                const st = STATUS_FACTURE[f.status] ?? STATUS_FACTURE.en_attente;
                return (
                  <Link
                    key={f.id}
                    href={`/admin/factures/${f.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-white/3 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-white text-sm font-medium">{f.number}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${st.color}`}>{st.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-slate-400 text-xs">
                      {f.totalTtcCt != null && <span className="text-white tabular-nums">{centimesToEuros(f.totalTtcCt)}</span>}
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{fmt(f.createdAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

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
