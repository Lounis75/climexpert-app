"use client";

import { Wind, LayoutDashboard, FileText, Users, LogOut, UserCircle, Contact, ClipboardList, Receipt, Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const tabs = [
  { href: "/admin/dashboard",     label: "Dashboard",      icon: LayoutDashboard },
  { href: "/admin/leads",         label: "Leads",          icon: Users },
  { href: "/admin/clients",       label: "Clients",        icon: Contact },
  { href: "/admin/devis",         label: "Devis",          icon: ClipboardList },
  { href: "/admin/factures",      label: "Factures",       icon: Receipt },
  { href: "/admin/interventions", label: "Interventions",  icon: Wrench },
  { href: "/admin/articles",      label: "Articles",       icon: FileText },
  { href: "/admin/authors",       label: "Auteurs",        icon: UserCircle },
];

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

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

        <nav className="flex items-center gap-1">
          {tabs.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                pathname.startsWith(href)
                  ? "bg-sky-500/15 text-sky-400 border-sky-500/30"
                  : "text-slate-400 hover:text-white border-transparent hover:border-white/10"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors flex-shrink-0"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>
    </header>
  );
}
