import AdminHeader from "@/components/AdminHeader";
import { getInterventions, TYPE_LABELS, TYPE_COLORS, STATUS_INTERVENTION } from "@/lib/interventions";
import Link from "next/link";
import { Plus, Wrench, Calendar, User, MapPin, ArrowRight } from "lucide-react";
import ViewToggle from "./ViewToggle";

export const dynamic = "force-dynamic";

function formatDate(d: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function isToday(d: Date | string | null) {
  if (!d) return false;
  const date = new Date(d);
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function isThisWeek(d: Date | string | null) {
  if (!d) return false;
  const date = new Date(d);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return date >= startOfWeek && date <= endOfWeek;
}

export default async function AdminInterventionsPage() {
  const list = await getInterventions();

  const today   = list.filter((i) => isToday(i.scheduledAt) && i.status !== "annulée");
  const week    = list.filter((i) => !isToday(i.scheduledAt) && isThisWeek(i.scheduledAt) && i.status !== "annulée");
  const upcoming = list.filter((i) => {
    if (!i.scheduledAt) return false;
    const d = new Date(i.scheduledAt);
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() - now.getDay() + 8);
    return d > endOfWeek && i.status !== "annulée";
  });
  const past = list.filter((i) => {
    if (!i.scheduledAt) return true;
    return new Date(i.scheduledAt) < new Date() && i.status !== "annulée";
  });

  function Section({ title, items, accent }: { title: string; items: typeof list; accent?: string }) {
    if (items.length === 0) return null;
    return (
      <div>
        <h2 className={`text-xs font-semibold mb-3 ${accent ?? "text-slate-400"}`}>{title}</h2>
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/5">
          {items.map((i) => {
            const status = STATUS_INTERVENTION[i.status] ?? STATUS_INTERVENTION.planifiée;
            const typeColor = TYPE_COLORS[i.type] ?? TYPE_COLORS.autre;
            return (
              <Link
                key={i.id}
                href={`/admin/interventions/${i.id}`}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${typeColor}`}>
                  <Wrench className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium">{i.clientName}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${typeColor}`}>
                      {TYPE_LABELS[i.type] ?? i.type}
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="text-slate-500 text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" />{formatDate(i.scheduledAt)}
                    </span>
                    {i.technicienName && (
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <User className="w-3 h-3" />{i.technicienName}
                      </span>
                    )}
                    {i.address && (
                      <span className="text-slate-500 text-xs flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3 h-3 flex-shrink-0" />{i.address}
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        <div className="mb-8 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Interventions</h1>
            <p className="text-slate-400 text-sm">
              {today.length > 0 && <span className="text-amber-400">{today.length} aujourd&apos;hui · </span>}
              {list.filter(i => i.status === "planifiée").length} planifiées au total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/interventions/new"
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Nouvelle intervention
            </Link>
          </div>
        </div>

        <ViewToggle
          listContent={
            list.length === 0 ? (
              <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-12 text-center">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mx-auto mb-4">
                  <Wrench className="w-5 h-5 text-sky-400" />
                </div>
                <h2 className="text-white font-semibold mb-2">Aucune intervention planifiée</h2>
                <p className="text-slate-400 text-sm mb-6">Planifiez des visites chez vos clients.</p>
                <Link href="/admin/interventions/new" className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-all">
                  <Plus className="w-3.5 h-3.5" /> Nouvelle intervention
                </Link>
              </div>
            ) : (
              <div className="space-y-8">
                <Section title="AUJOURD'HUI" items={today} accent="text-amber-400" />
                <Section title="CETTE SEMAINE" items={week} accent="text-sky-400" />
                <Section title="À VENIR" items={upcoming} />
                <Section title="PASSÉES" items={past} />
              </div>
            )
          }
        />
      </main>
    </div>
  );
}
