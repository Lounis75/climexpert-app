"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Calendar, Users, Contact, HeadphonesIcon, Menu, X, LogOut } from "lucide-react";
import { groups, standalone } from "./admin-nav";

// Barre d'accès rapide en bas, style iOS — affichée sur mobile (< md) uniquement.
// Consultation au pouce : 4 destinations clés + "Plus" (tiroir avec tout le reste).
const TABS = [
  { href: "/admin/interventions", label: "Planning",  icon: Calendar },
  { href: "/admin/leads",         label: "Prospects", icon: Users },
  { href: "/admin/clients",       label: "Clients",   icon: Contact },
  { href: "/admin/sav",           label: "SAV",       icon: HeadphonesIcon },
];

export default function MobileTabBar({ actions = 0 }: { actions?: number }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  // Ferme le tiroir à chaque navigation.
  useEffect(() => { setMoreOpen(false); }, [pathname]);

  // Empêche le scroll de l'arrière-plan quand le tiroir est ouvert.
  useEffect(() => {
    if (moreOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [moreOpen]);

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin");
  }

  const moreActive = !TABS.some((t) => pathname.startsWith(t.href)) && !pathname.startsWith("/admin/dashboard");

  return (
    <>
      {/* Tiroir "Plus" (bottom sheet) */}
      {moreOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <button aria-label="Fermer" onClick={() => setMoreOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-[1px]" />
          <div className="absolute bottom-0 inset-x-0 bg-slate-900 border-t border-white/10 rounded-t-3xl max-h-[82vh] overflow-y-auto pb-[env(safe-area-inset-bottom)] shadow-2xl">
            <div className="sticky top-0 bg-slate-900 flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/8">
              <span className="text-white text-sm font-semibold">Menu</span>
              <button onClick={() => setMoreOpen(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-5 py-4 space-y-5">
              <Link
                href={standalone.href}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname.startsWith(standalone.href) ? "bg-sky-500/15 text-sky-400" : "text-slate-200 active:bg-white/5"
                }`}
              >
                <standalone.icon className="w-4 h-4" /> {standalone.label}
              </Link>
              {groups.map((g) => (
                <div key={g.label}>
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1.5 px-1">{g.label}</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {g.items.map(({ href, label, icon: Icon }) => (
                      <Link
                        key={href}
                        href={href}
                        className={`flex items-center gap-2 px-3 py-3 rounded-xl text-sm transition-colors ${
                          pathname.startsWith(href) ? "bg-sky-500/15 text-sky-400" : "text-slate-200 active:bg-white/5"
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{label}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-3 rounded-xl text-sm text-slate-300 active:bg-white/5 transition-colors border-t border-white/10 mt-2 pt-4"
              >
                <LogOut className="w-4 h-4" /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barre du bas */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-900/95 backdrop-blur-sm border-t border-white/10 pt-1 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
        <div className="flex items-stretch h-16">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors ${
                  active ? "text-sky-400" : "text-slate-400 active:bg-white/5"
                }`}
              >
                <span className={`flex items-center justify-center w-10 h-7 rounded-lg ${active ? "bg-sky-500/15" : ""}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
          {/* Onglet Plus */}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 transition-colors relative ${
              moreActive || moreOpen ? "text-sky-400" : "text-slate-400 active:bg-white/5"
            }`}
          >
            <span className={`flex items-center justify-center w-10 h-7 rounded-lg ${moreActive || moreOpen ? "bg-sky-500/15" : ""}`}>
              <Menu className="w-5 h-5" />
              {actions > 0 && !moreOpen && (
                <span className="absolute top-0.5 right-[26%] w-2 h-2 bg-red-500 rounded-full ring-2 ring-slate-900" />
              )}
            </span>
            <span className="text-[10px] font-medium leading-none">Plus</span>
          </button>
        </div>
      </nav>
    </>
  );
}
