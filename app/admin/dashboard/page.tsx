import { getLeads } from "@/lib/leads";
import { getDynamicArticles } from "@/lib/dynamicArticles";
import { getFeaturedSlugs } from "@/lib/kv";
import { articles as staticArticles } from "@/lib/articles";
import AdminHeader from "@/components/AdminHeader";
import Link from "next/link";
import {
  Users, FileText, Star, TrendingUp, Phone, Bot,
  MessageSquare, Plus, ArrowRight, Clock, Wrench,
  Home, MapPin, UserCircle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  nouveau:      { label: "Nouveau",      color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  contacté:     { label: "Contacté",     color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  devis_envoyé: { label: "Devis envoyé", color: "bg-violet-500/10 text-violet-400 border-violet-500/30" },
  gagné:        { label: "Gagné",        color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  perdu:        { label: "Perdu",        color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
};

const PROJECT_LABELS: Record<string, string> = {
  installation: "Installation",
  entretien: "Entretien",
  depannage: "Dépannage",
  "contrat-pro": "Contrat pro",
  autre: "Autre",
};

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function timeAgo(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (h < 1) return "à l'instant";
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${days}j`;
}

export default async function DashboardPage() {
  const [leads, dynamicArticles, featuredSlugs] = await Promise.all([
    getLeads(),
    getDynamicArticles(),
    getFeaturedSlugs(),
  ]);

  const totalArticles = staticArticles.length + dynamicArticles.length;
  const newLeads = leads.filter((l) => l.status === "nouveau");
  const recentLeads = leads.slice(0, 6);

  const stats = [
    {
      label: "Leads total",
      value: leads.length,
      sub: `${newLeads.length} nouveau${newLeads.length > 1 ? "x" : ""}`,
      icon: Users,
      color: "sky",
      href: "/admin/leads",
    },
    {
      label: "Articles publiés",
      value: totalArticles,
      sub: `${dynamicArticles.length} rédigé${dynamicArticles.length > 1 ? "s" : ""} par vous`,
      icon: FileText,
      color: "violet",
      href: "/admin/articles",
    },
    {
      label: "À la une",
      value: featuredSlugs.length,
      sub: "dans le bandeau guide",
      icon: Star,
      color: "amber",
      href: "/admin/articles",
    },
    {
      label: "Leads gagnés",
      value: leads.filter((l) => l.status === "gagné").length,
      sub: `sur ${leads.length} total`,
      icon: TrendingUp,
      color: "emerald",
      href: "/admin/leads",
    },
  ];

  const colorMap: Record<string, string> = {
    sky:     "bg-sky-500/10 border-sky-500/20 text-sky-400",
    violet:  "bg-violet-500/10 border-violet-500/20 text-violet-400",
    amber:   "bg-amber-500/10 border-amber-500/20 text-amber-400",
    emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  };

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-white mb-1">Tableau de bord</h1>
          <p className="text-slate-400 text-sm">
            Activité récente · {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map(({ label, value, sub, icon: Icon, color, href }) => (
            <Link
              key={label}
              href={href}
              className="bg-slate-800/40 border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all group"
            >
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-3 ${colorMap[color]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-3xl font-bold text-white mb-0.5">{value}</p>
              <p className="text-slate-300 text-xs font-medium">{label}</p>
              <p className="text-slate-500 text-xs mt-1">{sub}</p>
            </Link>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Derniers leads */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm">Derniers leads</h2>
              <Link href="/admin/leads" className="text-sky-400 hover:text-sky-300 text-xs flex items-center gap-1 transition-colors">
                Voir tout <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentLeads.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Aucun lead pour l&apos;instant</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentLeads.map((lead) => {
                  const s = STATUS_LABELS[lead.status];
                  return (
                    <div key={lead.id} className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/3 transition-colors">
                      {/* Source icon */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        lead.source === "alex"
                          ? "bg-sky-500/10 text-sky-400"
                          : "bg-violet-500/10 text-violet-400"
                      }`}>
                        {lead.source === "alex" ? <Bot className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-white text-sm font-medium">{lead.name}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.color}`}>
                            {s.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {lead.project && (
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Wrench className="w-2.5 h-2.5" />
                              {PROJECT_LABELS[lead.project] ?? lead.project}
                            </span>
                          )}
                          {lead.location && (
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5" />
                              {lead.location}
                            </span>
                          )}
                          <span className="text-slate-600 text-xs flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {timeAgo(lead.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Call */}
                      <a
                        href={`tel:${lead.phone}`}
                        className="flex-shrink-0 w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 flex items-center justify-center transition-colors"
                        title={`Appeler ${lead.name}`}
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Actions rapides */}
          <div className="flex flex-col gap-4">
            <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/8">
                <h2 className="text-white font-semibold text-sm">Actions rapides</h2>
              </div>
              <div className="p-3 space-y-2">
                <Link
                  href="/admin/articles/new"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Nouvel article</p>
                    <p className="text-slate-500 text-xs">Rédiger et publier</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
                </Link>

                <Link
                  href="/admin/leads"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Gérer les leads</p>
                    <p className="text-slate-500 text-xs">
                      {newLeads.length > 0
                        ? `${newLeads.length} nouveau${newLeads.length > 1 ? "x" : ""} à traiter`
                        : "Voir le CRM"}
                    </p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
                </Link>

                <Link
                  href="/admin/articles"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Articles à la une</p>
                    <p className="text-slate-500 text-xs">{featuredSlugs.length} article{featuredSlugs.length > 1 ? "s" : ""} mis en avant</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
                </Link>

                <Link
                  href="/admin/authors"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0">
                    <UserCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Profils auteurs</p>
                    <p className="text-slate-500 text-xs">Gérer les techniciens</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
                </Link>

                <a
                  href="/"
                  target="_blank"
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Home className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-white text-xs font-medium">Voir le site</p>
                    <p className="text-slate-500 text-xs">climexpert.fr</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 ml-auto transition-colors" />
                </a>
              </div>
            </div>

            {/* Alerte nouveaux leads */}
            {newLeads.length > 0 && (
              <div className="bg-sky-500/10 border border-sky-500/25 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-sky-400 mt-1.5 flex-shrink-0 animate-pulse" />
                  <div>
                    <p className="text-sky-300 text-xs font-semibold mb-1">
                      {newLeads.length} lead{newLeads.length > 1 ? "s" : ""} à traiter
                    </p>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      {newLeads[0].name} · {formatDate(newLeads[0].createdAt)}
                    </p>
                    <Link href="/admin/leads" className="text-sky-400 text-xs hover:text-sky-300 mt-2 inline-flex items-center gap-1 transition-colors">
                      Voir les leads <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
