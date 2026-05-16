"use client";

import { Wind, LayoutDashboard, FileText, Users, LogOut, Contact, ClipboardList, Receipt, Wrench, Bell, CheckCheck, HardHat, ScrollText, HeadphonesIcon, Thermometer } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const tabs = [
  { href: "/admin/dashboard",     label: "Dashboard",      icon: LayoutDashboard },
  { href: "/admin/leads",         label: "Leads",          icon: Users },
  { href: "/admin/clients",       label: "Clients",        icon: Contact },
  { href: "/admin/devis",         label: "Devis",          icon: ClipboardList },
  { href: "/admin/factures",      label: "Factures",       icon: Receipt },
  { href: "/admin/interventions", label: "Interventions",  icon: Wrench },
  { href: "/admin/techniciens",   label: "Techniciens",    icon: HardHat },
  { href: "/admin/contrats",      label: "Contrats",       icon: ScrollText },
  { href: "/admin/sav",           label: "SAV",            icon: HeadphonesIcon },
  { href: "/admin/saisonnalite",   label: "Saisonnalité",   icon: Thermometer },
  { href: "/admin/articles",      label: "Articles",       icon: FileText },
  { href: "/admin/notifications", label: "Notifications",  icon: Bell },
];

type Notif = {
  id: string;
  type: string;
  titre: string;
  contenu: string | null;
  lu: boolean;
  refType: string | null;
  refId: string | null;
  createdAt: string;
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

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Charger le compteur non lus
  useEffect(() => {
    fetch("/api/admin/notifications?count=1")
      .then((r) => r.json())
      .then((d) => setUnread(d.count ?? 0))
      .catch(() => {});
  }, [pathname]); // recharge à chaque navigation

  async function openDropdown() {
    if (!open) {
      const res = await fetch("/api/admin/notifications");
      const d = await res.json();
      setNotifs(d.notifications ?? []);
    }
    setOpen((v) => !v);
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

  return (
    <header className="border-b border-white/10 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
            <Wind className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">
            Clim<span className="text-sky-400">Expert</span>
            <span className="text-slate-500 font-normal ml-1.5 hidden sm:inline">/ Admin</span>
          </span>
        </div>

        <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {tabs.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors border whitespace-nowrap ${
                pathname.startsWith(href)
                  ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                  : "text-slate-400 hover:text-white border-transparent hover:border-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{label}</span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Bell */}
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
                    notifs.map((n) => (
                      <div
                        key={n.id}
                        className={`px-4 py-3 flex gap-3 ${!n.lu ? "bg-sky-500/5" : ""}`}
                      >
                        <span className="text-sm flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? "🔔"}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium ${!n.lu ? "text-white" : "text-slate-300"}`}>
                            {n.titre}
                          </p>
                          {n.contenu && (
                            <p className="text-slate-500 text-xs mt-0.5 truncate">{n.contenu}</p>
                          )}
                          <p className="text-slate-600 text-[10px] mt-1">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.lu && (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}
