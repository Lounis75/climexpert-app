"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, ClipboardList, CalendarX2, Bell } from "lucide-react";

const tabs = [
  { href: "/technicien",               label: "Accueil",       icon: CalendarDays  },
  { href: "/technicien/interventions",  label: "Interventions", icon: ClipboardList },
  { href: "/technicien/disponibilites", label: "Indispos",      icon: CalendarX2    },
  { href: "/technicien/notifications",  label: "Notifs",        icon: Bell          },
];

export default function TechnicienNav({ name }: { name: string }) {
  const path = usePathname();
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          <span className="font-bold text-slate-900 text-sm">ClimExpert <span className="text-sky-500">Tech</span></span>
          <span className="text-xs text-slate-500 truncate max-w-[140px]">{name}</span>
        </div>
        <nav className="flex border-t border-slate-100">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = href === "/technicien" ? path === href : path.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  active ? "text-sky-600" : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
