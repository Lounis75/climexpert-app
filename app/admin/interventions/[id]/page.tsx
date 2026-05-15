import AdminHeader from "@/components/AdminHeader";
import { getInterventionById, TYPE_LABELS, TYPE_COLORS, STATUS_INTERVENTION } from "@/lib/interventions";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, User, MapPin, Wrench, FileText, Trash2 } from "lucide-react";
import InterventionActions from "./InterventionActions";

export const dynamic = "force-dynamic";

function formatDateLong(d: Date | string | null) {
  if (!d) return "—";
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
  const i = await getInterventionById(id);
  if (!i) notFound();

  const status = STATUS_INTERVENTION[i.status] ?? STATUS_INTERVENTION.planifiée;
  const typeColor = TYPE_COLORS[i.type] ?? TYPE_COLORS.autre;

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
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
          <InterventionActions id={i.id} currentStatus={i.status} notes={i.notes ?? ""} />
        </div>

        {/* Infos */}
        <div className="grid sm:grid-cols-2 gap-4">
          {i.technicienName && (
            <div className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
              <User className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Technicien</p>
                <p className="text-white text-sm font-medium">{i.technicienName}</p>
              </div>
            </div>
          )}
          {i.address && (
            <div className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
              <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Adresse</p>
                <p className="text-white text-sm">{i.address}</p>
              </div>
            </div>
          )}
          {i.scheduledAt && (
            <div className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3 flex items-center gap-3">
              <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-slate-500">Planifiée le</p>
                <p className="text-white text-sm capitalize">{formatDateLong(i.scheduledAt)}</p>
              </div>
            </div>
          )}
          {i.completedAt && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <Wrench className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <div>
                <p className="text-xs text-emerald-500">Terminée le</p>
                <p className="text-emerald-300 text-sm capitalize">{formatDateLong(i.completedAt)}</p>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="w-4 h-4 text-slate-500" />
            <h2 className="text-white font-semibold text-sm">Notes internes</h2>
          </div>
          <NotesEditor id={i.id} initialNotes={i.notes ?? ""} />
        </div>

        {/* Delete */}
        <div className="flex justify-end">
          <Link
            href="/admin/interventions"
            onClick={async (e) => {
              e.preventDefault();
              if (!confirm("Supprimer cette intervention ?")) return;
              await fetch(`/api/admin/interventions/${i.id}`, { method: "DELETE" });
              window.location.href = "/admin/interventions";
            }}
            className="flex items-center gap-1.5 text-slate-500 hover:text-red-400 text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Supprimer
          </Link>
        </div>

      </main>
    </div>
  );
}

// Inline notes editor — server component wraps a client island
function NotesEditor({ id, initialNotes }: { id: string; initialNotes: string }) {
  return <NotesEditorClient id={id} initialNotes={initialNotes} />;
}

import NotesEditorClient from "./NotesEditorClient";
