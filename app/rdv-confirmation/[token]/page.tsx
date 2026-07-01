import { db } from "@/lib/db";
import { interventions, clients } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { Wind, CalendarDays, Clock, MapPin } from "lucide-react";
import RdvConfirmClient from "./RdvConfirmClient";

export const dynamic = "force-dynamic";

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien", depannage: "Dépannage",
  depose: "Dépose", "contrat-pro": "Entretien", autre: "Intervention",
};

export default async function RdvConfirmationPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ a?: string }> }) {
  const { token } = await params;
  const { a } = await searchParams;

  const [iv] = await db.select({
    id: interventions.id, type: interventions.type, scheduledAt: interventions.scheduledAt,
    address: interventions.address, dureeMin: interventions.dureeEstimeeMinutes,
    confirmation: interventions.clientConfirmation, clientName: clients.name, clientAddress: clients.address,
  }).from(interventions).leftJoin(clients, eq(interventions.clientId, clients.id))
    .where(and(eq(interventions.confirmToken, token), isNull(interventions.supprimeLe))).limit(1);

  const invalid = !iv || !iv.scheduledAt;
  const start = iv?.scheduledAt ? new Date(iv.scheduledAt) : null;
  const end = start ? new Date(start.getTime() + Math.max(30, iv?.dureeMin ?? 120) * 60000) : null;
  const jour = start?.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }) ?? "";
  const h1 = start?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) ?? "";
  const h2 = end?.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }) ?? "";
  const prenom = (iv?.clientName || "").trim().split(" ")[0] || "";
  const lieu = (iv?.address || iv?.clientAddress || "").trim();
  const label = TYPE_LABELS[iv?.type ?? ""] ?? "Intervention";

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center"><Wind className="w-5 h-5 text-white" /></div>
          <span className="text-xl font-bold text-slate-900">Clim<span className="text-sky-500">Expert</span></span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-7">
          {invalid ? (
            <div className="text-center py-6">
              <p className="text-slate-700 font-semibold">Ce lien n&apos;est plus valide.</p>
              <p className="text-slate-500 text-sm mt-1">Contactez-nous au 06 67 43 27 67 si besoin.</p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold text-slate-900 mb-1">Bonjour{prenom ? ` ${prenom}` : ""},</h1>
              <p className="text-slate-500 text-sm mb-5">Merci de confirmer votre rendez-vous avec ClimExpert.</p>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2.5 mb-6">
                <p className="text-slate-900 font-semibold text-sm">{label}</p>
                <p className="text-slate-600 text-sm flex items-center gap-2"><CalendarDays className="w-4 h-4 text-sky-500 flex-shrink-0" /> <span className="capitalize">{jour}</span></p>
                <p className="text-slate-600 text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-sky-500 flex-shrink-0" /> {h1} – {h2}</p>
                {lieu && <p className="text-slate-600 text-sm flex items-center gap-2"><MapPin className="w-4 h-4 text-sky-500 flex-shrink-0" /> {lieu}</p>}
              </div>

              <RdvConfirmClient token={token} already={iv?.confirmation ?? null} preAction={a ?? null} />
            </>
          )}
        </div>
        <p className="text-slate-400 text-xs text-center mt-4">CLIM EXPERT · 200 rue de la Croix Nivert, 75015 Paris · contact@climexpert.fr</p>
      </div>
    </main>
  );
}
