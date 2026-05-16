"use client";

import { useState } from "react";
import { CheckCheck, Check, Bell } from "lucide-react";
import Link from "next/link";
import type { Notification } from "@/lib/notifications";

const TYPE_ICONS: Record<string, string> = {
  nouveau_lead: "👤",
  facture_en_retard: "⚠️",
  intervention_planifiee: "🔧",
};

const REF_LINKS: Record<string, (id: string) => string> = {
  lead: (id) => `/admin/leads`,
  devis: (id) => `/admin/devis/${id}`,
  facture: (id) => `/admin/factures/${id}`,
  intervention: (id) => `/admin/interventions/${id}`,
};

function timeAgo(d: string | Date) {
  const diff = Date.now() - new Date(d).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m}min`;
  if (h < 24) return `Il y a ${h}h`;
  if (days < 30) return `Il y a ${days}j`;
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function NotificationsClient({ initialNotifs }: { initialNotifs: Notification[] }) {
  const [notifs, setNotifs] = useState<Notification[]>(initialNotifs);

  const unreadCount = notifs.filter((n) => !n.lu).length;

  async function markOne(id: string) {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, lu: true } : n));
  }

  async function markAll() {
    await fetch("/api/admin/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    setNotifs((prev) => prev.map((n) => ({ ...n, lu: true })));
  }

  if (notifs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Bell className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">Aucune notification pour l&apos;instant</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <button
            onClick={markAll}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white text-xs transition-colors"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Tout marquer comme lu
          </button>
        </div>
      )}

      <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden divide-y divide-white/5">
        {notifs.map((n) => {
          const link = n.refType && n.refId ? REF_LINKS[n.refType]?.(n.refId) : null;

          return (
            <div
              key={n.id}
              className={`flex items-start gap-4 px-5 py-4 transition-colors ${!n.lu ? "bg-sky-500/5" : ""}`}
            >
              <span className="text-lg flex-shrink-0 mt-0.5">{TYPE_ICONS[n.type] ?? "🔔"}</span>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-sm font-medium ${!n.lu ? "text-white" : "text-slate-300"}`}>
                      {n.titre}
                    </p>
                    {n.contenu && (
                      <p className="text-slate-500 text-xs mt-0.5">{n.contenu}</p>
                    )}
                    <p className="text-slate-600 text-xs mt-1.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {link && (
                      <Link
                        href={link}
                        className="text-sky-500 hover:text-sky-400 text-xs font-medium transition-colors"
                      >
                        Voir →
                      </Link>
                    )}
                    {!n.lu && (
                      <button
                        onClick={() => markOne(n.id)}
                        title="Marquer comme lu"
                        className="text-slate-600 hover:text-emerald-400 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!n.lu && (
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0 mt-2" />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-slate-600 text-xs text-center">
        {notifs.length} notification{notifs.length > 1 ? "s" : ""} au total
      </p>
    </div>
  );
}
