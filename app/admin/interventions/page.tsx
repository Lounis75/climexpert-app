import AdminHeader from "@/components/AdminHeader";
import { getInterventions, TYPE_LABELS, TYPE_COLORS, STATUS_INTERVENTION } from "@/lib/interventions";
import Link from "next/link";
import { Plus, Wrench, Calendar, User, MapPin, ArrowRight, Handshake } from "lucide-react";
import ViewToggle from "./ViewToggle";
import { type PlanningEvent } from "./AgendaMobile";
import PlanningMobile from "./PlanningMobile";
import { getRendezVous } from "@/lib/leads";

export const dynamic = "force-dynamic";

function formatDate(d: Date | string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("fr-FR", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

export default async function AdminInterventionsPage() {
  // Admin = tout : interventions (terrain) + rendez-vous commerciaux (RDV pris).
  const [list, rdvs] = await Promise.all([getInterventions(), getRendezVous()]);

  // Événements unifiés pour l'agenda mobile (interventions + RDV distingués).
  const events: PlanningEvent[] = [
    ...list.map((i): PlanningEvent => ({
      id: i.id, kind: "intervention", title: i.clientName,
      start: i.scheduledAt ? new Date(i.scheduledAt).toISOString() : null,
      durationMin: i.dureeEstimeeMinutes ?? null, category: i.type, status: i.status,
      assignee: i.technicienName ?? null, address: i.address ?? null,
      href: `/admin/interventions/${i.id}`,
    })),
    ...rdvs.map((r): PlanningEvent => ({
      id: r.id, kind: "rdv", title: r.name,
      start: r.rdvDate ? new Date(r.rdvDate).toISOString() : null,
      durationMin: 120, category: "rdv", status: null,
      assignee: r.commercialName ?? null, address: r.address ?? r.location ?? null,
      href: `/admin/leads?lead=${r.id}`,
    })),
  ];

  // Bornes normalisées à minuit pour un découpage sans trou ni chevauchement.
  const now = new Date();
  const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(todayStart.getDate() + 1);
  const dow = (now.getDay() + 6) % 7; // lundi=0 … dimanche=6
  const nextWeekStart = new Date(todayStart); nextWeekStart.setDate(todayStart.getDate() + (7 - dow)); // lundi prochain 00:00

  const active = list.filter((i) => i.status !== "annulée");
  const today = active.filter((i) => i.scheduledAt && startOfDay(new Date(i.scheduledAt)).getTime() === todayStart.getTime());
  const week = active.filter((i) => {
    if (!i.scheduledAt) return false;
    const d = new Date(i.scheduledAt);
    return d >= tomorrowStart && d < nextWeekStart; // reste de la semaine (hors aujourd'hui)
  });
  const upcoming = active.filter((i) => i.scheduledAt && new Date(i.scheduledAt) >= nextWeekStart);
  const past = active.filter((i) => !i.scheduledAt || new Date(i.scheduledAt) < todayStart);

  // Rendez-vous commerciaux à venir (pour la vue Liste desktop).
  const rdvUpcoming = rdvs.filter((r) => r.rdvDate && new Date(r.rdvDate) >= todayStart);

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

        {/* Mobile (< md) : agenda « façon Apple », interventions + rendez-vous */}
        <div className="md:hidden">
          <PlanningMobile
            events={events}
            emptyTitle="Aucun élément planifié"
            emptySubtitle="Les interventions et rendez-vous apparaîtront ici."
            newHref="/admin/interventions/new"
            newLabel="Nouvelle intervention"
          />
        </div>

        {/* Desktop / tablette (md+) : Liste / Calendrier avec glisser-déposer */}
        <div className="hidden md:block">
        <ViewToggle
          listContent={
            list.length === 0 && rdvUpcoming.length === 0 ? (
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
                {rdvUpcoming.length > 0 && (
                  <div>
                    <h2 className="text-xs font-semibold mb-3 text-fuchsia-400">RENDEZ-VOUS COMMERCIAUX À VENIR</h2>
                    <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/5">
                      {rdvUpcoming.map((r) => (
                        <Link key={r.id} href={`/admin/leads?lead=${r.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors group">
                          <div className="w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30">
                            <Handshake className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white text-sm font-medium">{r.name}</span>
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30">RDV</span>
                            </div>
                            <div className="flex items-center gap-3 mt-0.5 flex-wrap text-slate-500 text-xs">
                              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(r.rdvDate)}</span>
                              {r.commercialName && <span className="flex items-center gap-1"><User className="w-3 h-3" />{r.commercialName}</span>}
                              {(r.address ?? r.location) && <span className="flex items-center gap-1 truncate max-w-[200px]"><MapPin className="w-3 h-3 flex-shrink-0" />{r.address ?? r.location}</span>}
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <Section title="AUJOURD'HUI" items={today} accent="text-amber-400" />
                <Section title="CETTE SEMAINE" items={week} accent="text-sky-400" />
                <Section title="À VENIR" items={upcoming} />
                <Section title="PASSÉES" items={past} />
              </div>
            )
          }
        />
        </div>
      </main>
    </div>
  );
}
