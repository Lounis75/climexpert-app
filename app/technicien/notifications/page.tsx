"use client";
import { useEffect, useState, useCallback } from "react";
import { Bell, BellOff, Check, CheckCheck } from "lucide-react";

type Notif = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  readAt: string | null;
  createdAt: string;
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "À l'instant";
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h}h`;
  const d = Math.floor(h / 24);
  return `Il y a ${d}j`;
}

export default function NotificationsPage() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch("/api/technicien/notifications")
      .then((r) => r.json())
      .then((d) => setItems(Array.isArray(d) ? d : []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const timer = setInterval(load, 30000);
    return () => clearInterval(timer);
  }, [load]);

  async function markRead(id: string) {
    await fetch("/api/technicien/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setItems((prev) => prev.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
  }

  async function markAllRead() {
    await fetch("/api/technicien/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setItems((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() })));
  }

  const unread = items.filter((n) => !n.readAt).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        {unread > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-1.5 text-xs text-sky-500 font-semibold"
          >
            <CheckCheck className="w-4 h-4" /> Tout marquer lu
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center">
          <BellOff className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Aucune notification.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.readAt && markRead(n.id)}
              className={`flex items-start gap-4 rounded-2xl p-4 transition-colors cursor-pointer ${
                n.readAt
                  ? "bg-white border border-slate-100"
                  : "bg-sky-50 border border-sky-200"
              }`}
            >
              <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                n.readAt ? "bg-slate-100" : "bg-sky-100"
              }`}>
                <Bell className={`w-4 h-4 ${n.readAt ? "text-slate-400" : "text-sky-500"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${n.readAt ? "text-slate-700" : "text-slate-900"}`}>
                  {n.title}
                </p>
                {n.message && (
                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p>
                )}
                <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.readAt && (
                <div className="w-2 h-2 bg-sky-500 rounded-full mt-2 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
