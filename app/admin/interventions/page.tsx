import AdminHeader from "@/components/AdminHeader";
import { getInterventions, getTechniciens, TYPE_LABELS, TYPE_COLORS, STATUS_INTERVENTION } from "@/lib/interventions";
import Link from "next/link";
import { Plus, Wrench, Calendar, User, MapPin, ArrowRight, Handshake } from "lucide-react";
import ViewToggle from "./ViewToggle";
import { type PlanningEvent } from "./AgendaMobile";
import PlanningMobile from "./PlanningMobile";
import AAffecterSection, { type AAffecterItem } from "./AAffecterSection";
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
  const [list, rdvs, techniciens] = await Promise.all([getInterventions(), getRendezVous(), getTechniciens()]);

  // « À affecter » : devis gagnés (interventions planifiées SANS technicien) en attente d'attribution.
  // C'est le pont commercial -> production. On les sort des sections datées pour les regrouper en tête.
  const aAffecter = list.filter((i) => i.status === "planifiée" && !i.technicienId);
  const aAffecterIds = new Set(aAffecter.map((i) => i.id));
  const aAffecterItems: AAffecterItem[] = aAffecter.map((i) => ({
    id: i.id, clientName: i.clientName, type: i.type, address: i.address ?? null,
    scheduledAt: i.scheduledAt ? new Date(i.scheduledAt).toISOString() : null,
    dureeMin: i.dureeEstimeeMinutes ?? null,
  }));
  const techList = techniciens
    .filter((t) => !t.supprimeLe)
    .map((t) => ({ id: t.id, name: t.prenom ? `${t.prenom} ${t.name}` : t.name }));

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

  // Vue Liste desktop : interventions + RDV FUSIONNÉS, triés chronologiquement, colorés par type.
  const byStart = (a: PlanningEvent, b: PlanningEvent) => new Date(a.start!).getTime() - new Date(b.start!).getTime();
  // Les interventions « à affecter » vivent dans leur propre boîte, pas dans les sections datées/passées.
  const listable = events.filter((e) => !aAffecterIds.has(e.id));
  const evDated = listable.filter((e) => e.start);
  const evToday = evDated.filter((e) => startOfDay(new Date(e.start!)).getTime() === todayStart.getTime()).sort(byStart);
  const evWeek = evDated.filter((e) => { const d = new Date(e.start!); return d >= tomorrowStart && d < nextWeekStart; }).sort(byStart);
  const evUpcoming = evDated.filter((e) => new Date(e.start!) >= nextWeekStart).sort(byStart);
  const evPast = listable.filter((e) => !e.start || new Date(e.start!) < todayStart).sort((a, b) => byStart(b, a));

  // Carte unifiée : intervention (couleur selon le type) OU rendez-vous commercial (fuchsia).
  function EventSection({ title, items, accent }: { title: string; items: PlanningEvent[]; accent?: string }) {
    if (items.length === 0) return null;
    return (
      <div>
        <h2 className={`text-xs font-semibold mb-3 ${accent ?? "text-slate-400"}`}>{title}</h2>
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/5">
          {items.map((e) => {
            const isRdv = e.kind === "rdv";
            const color = isRdv ? "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30" : (TYPE_COLORS[e.category] ?? TYPE_COLORS.autre);
            const status = e.status ? (STATUS_INTERVENTION[e.status] ?? null) : null;
            return (
              <Link
                key={`${e.kind}-${e.id}`}
                href={e.href ?? "#"}
                className="flex items-center gap-4 px-5 py-4 hover:bg-white/3 transition-colors group"
              >
                <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${color}`}>
                  {isRdv ? <Handshake className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium">{e.title}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${color}`}>
                      {isRdv ? "RDV commercial" : (TYPE_LABELS[e.category] ?? e.category)}
                    </span>
                    {status && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap text-slate-500 text-xs">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(e.start)}</span>
                    {e.assignee && <span className="flex items-center gap-1"><User className="w-3 h-3" />{e.assignee}</span>}
                    {e.address && <span className="flex items-center gap-1 truncate max-w-[200px]"><MapPin className="w-3 h-3 flex-shrink-0" />{e.address}</span>}
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
            events.length === 0 ? (
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
                {/* Pont commercial -> production : devis gagnés en attente d'un technicien. */}
                <AAffecterSection items={aAffecterItems} techniciens={techList} />
                {/* Interventions + RDV commerciaux fusionnés, triés par heure, couleur par type. */}
                <div className="flex items-center gap-4 flex-wrap text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-fuchsia-500/70" /> RDV commercial</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500/70" /> Installation</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" /> Entretien</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500/70" /> Dépannage</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-500/70" /> Dépose</span>
                </div>
                <EventSection title="AUJOURD'HUI" items={evToday} accent="text-amber-400" />
                <EventSection title="CETTE SEMAINE" items={evWeek} accent="text-sky-400" />
                <EventSection title="À VENIR" items={evUpcoming} />
                <EventSection title="PASSÉES" items={evPast} />
              </div>
            )
          }
        />
        </div>
      </main>
    </div>
  );
}
