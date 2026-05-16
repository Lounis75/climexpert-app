import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyTechnicienToken, TECH_COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { interventions, clients, notifications } from "@/lib/db/schema";
import { eq, and, isNull, gte, lte, desc } from "drizzle-orm";
import Link from "next/link";
import { Calendar, ChevronRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Autre",
};
const STATUS_COLORS: Record<string, string> = {
  "planifiée":  "bg-sky-50 text-sky-700 border-sky-200",
  "en_cours":   "bg-amber-50 text-amber-700 border-amber-200",
  "terminée":   "bg-emerald-50 text-emerald-700 border-emerald-200",
  "annulée":    "bg-slate-50 text-slate-500 border-slate-200",
};

function formatTime(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
}

export default async function TechnicienDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get(TECH_COOKIE_NAME)?.value;
  const session = token ? await verifyTechnicienToken(token) : null;
  if (!session) redirect("/technicien/login");

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay   = new Date(startOfDay.getTime() + 86400000 - 1);

  const todayInterventions = await db
    .select({
      id:          interventions.id,
      type:        interventions.type,
      status:      interventions.status,
      scheduledAt: interventions.scheduledAt,
      address:     interventions.address,
      clientName:  clients.name,
      clientPhone: clients.phone,
    })
    .from(interventions)
    .leftJoin(clients, eq(interventions.clientId, clients.id))
    .where(
      and(
        eq(interventions.technicienId, session.sub),
        isNull(interventions.supprimeLe),
        gte(interventions.scheduledAt, startOfDay),
        lte(interventions.scheduledAt, endOfDay)
      )
    )
    .orderBy(interventions.scheduledAt);

  const unreadCount = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.adminId, session.sub), eq(notifications.lu, false)));

  const today = now.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-slate-500 capitalize">{today}</p>
        <h1 className="text-xl font-bold text-slate-900">Bonjour {session.name.split(" ")[0]} 👋</h1>
      </div>

      {unreadCount.length > 0 && (
        <Link href="/technicien/notifications" className="flex items-center gap-3 bg-sky-50 border border-sky-200 rounded-xl p-4">
          <AlertCircle className="w-5 h-5 text-sky-500 flex-shrink-0" />
          <span className="text-sky-800 text-sm font-medium">
            {unreadCount.length} notification{unreadCount.length > 1 ? "s" : ""} non lue{unreadCount.length > 1 ? "s" : ""}
          </span>
          <ChevronRight className="w-4 h-4 text-sky-400 ml-auto" />
        </Link>
      )}

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-sky-500" />
            Interventions du jour
          </h2>
          <Link href="/technicien/interventions" className="text-sky-500 text-xs font-medium">Tout voir →</Link>
        </div>

        {todayInterventions.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">Aucune intervention aujourd'hui.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {todayInterventions.map((i) => (
              <Link
                key={i.id}
                href={`/technicien/interventions/${i.id}`}
                className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-4 hover:border-sky-200 transition-colors"
              >
                <div className="flex-shrink-0 text-center min-w-[48px]">
                  <p className="text-lg font-bold text-slate-900">{formatTime(i.scheduledAt)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">{i.clientName ?? "—"}</p>
                  <p className="text-slate-500 text-xs truncate">{TYPE_LABELS[i.type] ?? i.type} · {i.address ?? "Adresse non renseignée"}</p>
                </div>
                <span className={`flex-shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[i.status] ?? "bg-slate-50 text-slate-500 border-slate-200"}`}>
                  {i.status}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
