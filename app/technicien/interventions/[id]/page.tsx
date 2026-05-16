import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { verifyTechnicienToken, TECH_COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { interventions, clients, rapportsIntervention } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import Link from "next/link";
import { MapPin, Phone, Wrench, Clock, ChevronLeft, ClipboardCheck } from "lucide-react";
import InterventionStatusButton from "./InterventionStatusButton";

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Autre",
};

function formatDateTime(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris",
  });
}

export default async function InterventionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get(TECH_COOKIE_NAME)?.value;
  const session = token ? await verifyTechnicienToken(token) : null;
  if (!session) redirect("/technicien/login");

  const [row] = await db
    .select({
      id:                  interventions.id,
      type:                interventions.type,
      status:              interventions.status,
      scheduledAt:         interventions.scheduledAt,
      address:             interventions.address,
      codePostal:          interventions.codePostal,
      notes:               interventions.notes,
      dureeEstimeeMinutes: interventions.dureeEstimeeMinutes,
      clientId:            interventions.clientId,
      clientName:          clients.name,
      clientPhone:         clients.phone,
      clientAddress:       clients.address,
      equipement:          clients.equipementInstalle,
      marqueModele:        clients.marqueModele,
    })
    .from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .where(and(eq(interventions.id, id), eq(interventions.technicienId, session.sub), isNull(interventions.supprimeLe)))
    .limit(1);

  if (!row) notFound();

  const [rapport] = await db
    .select()
    .from(rapportsIntervention)
    .where(eq(rapportsIntervention.interventionId, id))
    .limit(1);

  const duree = row.dureeEstimeeMinutes
    ? `${Math.floor(row.dureeEstimeeMinutes / 60)}h${row.dureeEstimeeMinutes % 60 > 0 ? String(row.dureeEstimeeMinutes % 60).padStart(2, "0") : ""}`
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/technicien/interventions" className="p-2 bg-white border border-slate-200 rounded-xl">
          <ChevronLeft className="w-4 h-4 text-slate-600" />
        </Link>
        <h1 className="font-bold text-slate-900">{TYPE_LABELS[row.type] ?? row.type}</h1>
      </div>

      {/* Infos clés */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-3">
        <div className="flex items-start gap-3">
          <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-slate-900 capitalize">{formatDateTime(row.scheduledAt)}</p>
            {duree && <p className="text-xs text-slate-500">Durée estimée : {duree}</p>}
          </div>
        </div>
        {(row.address || row.codePostal) && (
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-slate-700">{[row.address, row.codePostal].filter(Boolean).join(", ")}</p>
          </div>
        )}
      </div>

      {/* Client */}
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">Client</p>
        <p className="font-semibold text-slate-900 mb-1">{row.clientName ?? "—"}</p>
        {row.clientPhone && (
          <a href={`tel:${row.clientPhone}`} className="flex items-center gap-2 text-sky-500 text-sm font-medium">
            <Phone className="w-4 h-4" /> {row.clientPhone}
          </a>
        )}
        {row.clientAddress && <p className="text-xs text-slate-500 mt-1">{row.clientAddress}</p>}
      </div>

      {/* Équipement */}
      {(row.equipement || row.marqueModele) && (
        <div className="bg-white border border-slate-100 rounded-2xl p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Équipement</p>
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-400" />
            <p className="text-sm text-slate-700">{[row.equipement, row.marqueModele].filter(Boolean).join(" — ")}</p>
          </div>
        </div>
      )}

      {/* Notes admin */}
      {row.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">Notes admin</p>
          <p className="text-sm text-amber-900">{row.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {!rapport && row.status !== "annulée" && (
          <InterventionStatusButton id={row.id} currentStatus={row.status} />
        )}
        {!rapport && (row.status === "en_cours" || row.status === "terminée") && (
          <Link
            href={`/technicien/interventions/${id}/rapport`}
            className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors"
          >
            <ClipboardCheck className="w-5 h-5" />
            Soumettre le rapport de clôture
          </Link>
        )}
        {rapport && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <ClipboardCheck className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Rapport soumis</p>
              <p className="text-xs text-emerald-600">{rapport.installationConforme ? "Installation conforme ✓" : "⚠️ Non conforme"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
