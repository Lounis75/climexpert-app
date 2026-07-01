import AdminHeader from "@/components/AdminHeader";
import { getInterventionById, getTechniciens, TYPE_LABELS, TYPE_COLORS, STATUS_INTERVENTION } from "@/lib/interventions";
import { getChantierById } from "@/lib/chantiers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Wrench, FileText, Image as ImageIcon, Briefcase, HardHat, CheckCircle2, AlertTriangle } from "lucide-react";
import InterventionActions from "./InterventionActions";
import CopyableContact from "@/components/CopyableContact";
import BriefingPhotos from "./BriefingPhotos";
import CreneauEditor from "./CreneauEditor";
import TechnicienEditor from "./TechnicienEditor";
import EnvoyerConfirmationClient from "./EnvoyerConfirmationClient";
import FactureUpload from "./FactureUpload";
import { db } from "@/lib/db";
import { rapportsIntervention } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

function parsePhotos(json: string | null): string[] {
  if (!json) return [];
  try { return JSON.parse(json) as string[]; } catch { return []; }
}

function formatDateLong(d: Date | string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function InterventionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [i, techniciens] = await Promise.all([getInterventionById(id), getTechniciens()]);
  if (!i) notFound();
  const techList = techniciens
    .filter((t) => !t.supprimeLe)
    .map((t) => ({ id: t.id, name: t.prenom ? `${t.prenom} ${t.name}` : t.name }));

  const status = STATUS_INTERVENTION[i.status] ?? STATUS_INTERVENTION.planifiée;
  const typeColor = TYPE_COLORS[i.type] ?? TYPE_COLORS.autre;
  const chantier = i.chantierId ? await getChantierById(i.chantierId) : null;
  const [rapportSig] = await db
    .select({ demandee: rapportsIntervention.cerfaSignatureDemandeeLe, signe: rapportsIntervention.cerfaClientSigneLe })
    .from(rapportsIntervention).where(eq(rapportsIntervention.interventionId, id)).limit(1);

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/interventions" className="text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-white">{i.clientName}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${typeColor}`}>
                  {TYPE_LABELS[i.type] ?? i.type}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-0.5 capitalize">{formatDateLong(i.scheduledAt)}</p>
            </div>
          </div>
          <div className="w-full sm:w-auto">
            <InterventionActions
              id={i.id}
              currentStatus={i.status}
              notes={i.notes ?? ""}
              techniciens={techList}
              currentTechnicienId={i.technicienId ?? ""}
              currentScheduledAt={i.scheduledAt ? new Date(i.scheduledAt).toISOString() : ""}
              currentType={i.type}
              currentDuree={i.dureeEstimeeMinutes ?? 120}
              currentVersion={i.version}
            />
          </div>
        </div>

        {/* Ordre de mission, PDF à transmettre à un sous-traitant (qui n'a pas le portail) */}
        <a
          href={`/api/admin/interventions/${i.id}/ordre-mission`}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-white/10 text-slate-200 hover:border-sky-500/40 hover:text-white text-sm font-semibold transition-colors"
        >
          <FileText className="w-4 h-4 text-sky-400" /> Ordre de mission (PDF)
        </a>

        {/* Réponse du client à la demande de confirmation de RDV */}
        {i.clientConfirmation === "confirme" && (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-300 font-semibold text-sm">Rendez-vous confirmé par le client</p>
              {i.clientConfirmationLe && <p className="text-slate-400 text-xs mt-0.5 capitalize">Le {formatDateLong(i.clientConfirmationLe)}</p>}
            </div>
          </div>
        )}
        {i.clientConfirmation === "probleme" && (
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-amber-300 font-semibold text-sm">Problème signalé par le client</p>
              {i.clientConfirmationMsg && <p className="text-slate-100 text-sm mt-1">« {i.clientConfirmationMsg} »</p>}
              <p className="text-slate-400 text-xs mt-1">{i.clientConfirmationLe && <span className="capitalize">Le {formatDateLong(i.clientConfirmationLe)} · </span>}À recontacter pour convenir d&apos;un nouveau créneau.</p>
            </div>
          </div>
        )}

        {/* Attestation d'entretien (CERFA) envoyée pour signature à distance */}
        {rapportSig?.signe ? (
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-emerald-300 font-semibold text-sm">Attestation signée par le client</p>
              <p className="text-slate-400 text-xs mt-0.5 capitalize">Le {formatDateLong(rapportSig.signe)}</p>
            </div>
          </div>
        ) : rapportSig?.demandee ? (
          <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-semibold text-sm">Attestation envoyée au client pour signature</p>
              <p className="text-slate-400 text-xs mt-0.5">En attente de sa signature. <span className="capitalize">Demande envoyée le {formatDateLong(rapportSig.demandee)}.</span></p>
            </div>
          </div>
        ) : null}

        {/* Facturation : disponible une fois l'intervention terminée */}
        {i.status === "terminée" && (
          <FactureUpload
            interventionId={i.id}
            factureUrl={i.factureUrl ?? null}
            factureEnvoyeeLe={i.factureEnvoyeeLe ? new Date(i.factureEnvoyeeLe).toISOString() : null}
            hasEmail={!!i.clientEmail}
          />
        )}

        {/* Infos */}
        {/* Technicien + Créneau côte à côte (qui / quand), le reste en pleine largeur (pas de vides). */}
        <div className="grid sm:grid-cols-2 gap-3">
          <TechnicienEditor id={i.id} technicienId={i.technicienId ?? null} technicienName={i.technicienName ?? null} techniciens={techList} />
          {i.scheduledAt && (
            <CreneauEditor
              id={i.id}
              scheduledAt={new Date(i.scheduledAt).toISOString()}
              dureeMin={i.dureeEstimeeMinutes}
            />
          )}
          {chantier && (
            <Link href={`/admin/clients/${i.clientId}`} className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3 hover:border-amber-500/30 transition-colors sm:col-span-2">
              <HardHat className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-slate-500">Chantier</p>
                <p className="text-white text-sm font-medium truncate">{chantier.nom}</p>
              </div>
            </Link>
          )}
          {(i.siteNom || i.siteAdresse) && (
            <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3 sm:col-span-2">
              <Briefcase className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-amber-300">Sous-traitance, site du client final</p>
                <p className="text-white text-sm">{[i.siteNom, i.siteAdresse].filter(Boolean).join(" · ")}</p>
              </div>
            </div>
          )}
          {i.completedAt && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3 sm:col-span-2">
              <Wrench className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-emerald-500">Terminée le</p>
                <p className="text-emerald-300 text-sm capitalize">{formatDateLong(i.completedAt)}</p>
              </div>
            </div>
          )}
          {/* Contact client regroupé : téléphone · adresse · e-mail, copiables */}
          <CopyableContact phone={i.clientPhone} address={i.address || i.clientAddress} email={i.clientEmail} />
        </div>

        {/* Envoi manuel de la confirmation d'intervention au client */}
        <EnvoyerConfirmationClient id={i.id} hasEmail={!!i.clientEmail} hasSchedule={!!i.scheduledAt} />

        {/* Notes */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="text-white font-semibold text-sm">Notes internes</h2>
          </div>
          <NotesEditor id={i.id} initialNotes={i.notes ?? ""} version={i.version} />
        </div>

        {/* Photos de briefing, l'admin ajoute des photos pour aider le technicien */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <ImageIcon className="w-4 h-4 text-slate-500" />
            <h2 className="text-white font-semibold text-sm">Photos pour le technicien</h2>
          </div>
          <BriefingPhotos id={i.id} initial={parsePhotos(i.photosBriefing)} />
        </div>

      </main>
    </div>
  );
}

// Inline notes editor, server component wraps a client island
function NotesEditor({ id, initialNotes, version }: { id: string; initialNotes: string; version: number }) {
  return <NotesEditorClient id={id} initialNotes={initialNotes} currentVersion={version} />;
}

import NotesEditorClient from "./NotesEditorClient";
