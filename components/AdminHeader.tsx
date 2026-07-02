"use client";

import {
  Wind, LayoutDashboard, LogOut, Bell, CheckCheck, ChevronDown, AlertTriangle, Users, Wrench,
} from "lucide-react";
import AdminChatBot from "./AdminChatBot";
import MobileTabBar from "./MobileTabBar";
import { groups, standalone } from "./admin-nav";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Notif = {
  id: string; type: string; titre: string;
  contenu: string | null; lu: boolean;
  refType: string | null; refId: string | null; createdAt: string;
};

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m}m`;
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${days}j`;
}

const TYPE_ICONS: Record<string, string> = {
  nouveau_lead: "👤",
  facture_en_retard: "⚠️",
  intervention_planifiee: "🔧",
};

function NavDropdown({ group, pathname }: { group: typeof groups[0]; pathname: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = group.items.some((i) => pathname.startsWith(i.href));

  useEffect(() => {
    function h(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  // Close on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap ${
          isActive
            ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
            : "text-slate-400 hover:text-white border-transparent hover:border-white/10"
        }`}
      >
        {group.label}
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-44 bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50 py-1">
          {group.items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                pathname.startsWith(href)
                  ? "bg-sky-500/15 text-sky-400"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [actions, setActions] = useState(0);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Réserve l'espace bas pour la barre d'onglets mobile (voir globals.css).
  useEffect(() => {
    document.body.classList.add("has-mobile-tabbar");
    return () => document.body.classList.remove("has-mobile-tabbar");
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    fetch("/api/admin/notifications?count=1")
      .then((r) => r.json())
      .then((d) => setUnread(d.count ?? 0))
      .catch(() => {});
    fetch("/api/admin/actions")
      .then((r) => r.json())
      .then((d) => setActions(d.total ?? 0))
      .catch(() => {});
  }, [pathname]);

  async function openDropdown() {
    if (!open) {
      try {
        const res = await fetch("/api/admin/notifications");
        const d = await res.json();
        setNotifs(d.notifications ?? []);
      } catch { /* réseau : on ouvre quand même la cloche (vide) au lieu de rester bloqué */ }
    }
    setOpen((v) => !v);
  }

  // Chaque notification mène à la fiche concernée (avant : simple texte, il fallait
  // aller chercher l'élément soi-même).
  function notifHref(n: { refType?: string | null; refId?: string | null }): string | null {
    if (!n.refId) return null;
    switch (n.refType) {
      case "lead":         return `/admin/leads?lead=${n.refId}`;
      case "intervention": return `/admin/interventions`;
      case "client":       return `/admin/clients/${n.refId}`;
      case "contrat":      return `/admin/contrats`;
      case "devis":        return `/admin/devis`;
      case "sav":          return `/admin/sav`;
      case "facture":      return `/admin/facturation`;
      default:             return null;
    }
  }

  async function markAllRead() {
    await fetch("/api/admin/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: "{}" });
    setUnread(0);
    setNotifs((prev) => prev.map((n) => ({ ...n, lu: true })));
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin");
  }

  const isDashboard = pathname.startsWith("/admin/dashboard");

  return (
    <>
    <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
            <Wind className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">
            Clim<span className="text-sky-400">Expert</span>
            <span className="text-slate-500 font-normal ml-1.5 hidden sm:inline">/ Admin</span>
          </span>
        </div>

        {/* Nav (desktop / tablette md+) */}
        <nav className="hidden md:flex items-center gap-0.5">
          {/* Dashboard */}
          <Link
            href={standalone.href}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap ${
              isDashboard
                ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                : "text-slate-400 hover:text-white border-transparent hover:border-white/10"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </Link>

          {/* Raccourcis directs vers les 2 pages utilisées toute la journée (avant : 2 clics
              via les menus déroulants). */}
          {[
            { href: "/admin/leads", label: "Prospects", icon: Users },
            { href: "/admin/interventions", label: "Interventions", icon: Wrench },
          ].map((s) => {
            const active = pathname.startsWith(s.href);
            return (
              <Link
                key={s.href}
                href={s.href}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap ${
                  active ? "bg-sky-500/15 text-sky-400 border-sky-500/30" : "text-slate-400 hover:text-white border-transparent hover:border-white/10"
                }`}
              >
                <s.icon className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{s.label}</span>
              </Link>
            );
          })}

          {/* Grouped dropdowns */}
          {groups.map((g) => (
            <NavDropdown key={g.label} group={g} pathname={pathname} />
          ))}
        </nav>

        {/* Right: actions + bell + logout */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Compteur global d'actions à faire (repères rouges) */}
          {actions > 0 && (
            <Link
              href="/admin/dashboard"
              title={`${actions} action${actions > 1 ? "s" : ""} à faire`}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-200 text-xs font-semibold hover:bg-red-500/20 transition-colors"
            >
              <AlertTriangle className="w-3 h-3" />
              {actions}
              <span className="hidden sm:inline">action{actions > 1 ? "s" : ""}</span>
            </Link>
          )}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={openDropdown}
              className="relative w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
            >
              <Bell className="w-4 h-4" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-10 w-80 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <span className="text-white text-xs font-semibold">Notifications</span>
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="flex items-center gap-1 text-slate-400 hover:text-white text-xs transition-colors"
                    >
                      <CheckCheck className="w-3.5 h-3.5" /> Tout lire
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                  {notifs.length === 0 ? (
                    <p className="text-slate-500 text-xs text-center py-8">Aucune notification</p>
                  ) : (
                    notifs.map((n) => {
                      const href = notifHref(n);
                      const inner = (
                        <>
                          <span className="text-sm flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-medium ${!n.lu ? "text-white" : "text-slate-300"}`}>{n.titre}</p>
                            {n.contenu && <p className="text-slate-500 text-xs mt-0.5 truncate">{n.contenu}</p>}
                            <p className="text-slate-600 text-[10px] mt-1">{timeAgo(n.createdAt)}</p>
                          </div>
                          {!n.lu && <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0 mt-1.5" />}
                        </>
                      );
                      const cls = `px-4 py-3 flex gap-3 ${!n.lu ? "bg-sky-500/5" : ""}`;
                      return href ? (
                        <Link key={n.id} href={href} onClick={() => setOpen(false)} className={`${cls} hover:bg-white/5 transition-colors`}>
                          {inner}
                        </Link>
                      ) : (
                        <div key={n.id} className={cls}>{inner}</div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="hidden md:flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
    {/* Accès rapide en bas (mobile) */}
    <MobileTabBar actions={actions} />
    <AdminChatBot />
    </>
  );
}
