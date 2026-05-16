"use client";
import { useState } from "react";
import { List, CalendarDays } from "lucide-react";
import dynamic from "next/dynamic";

const CalendrierAdmin = dynamic(() => import("./CalendrierAdmin"), { ssr: false });

export default function ViewToggle({ listContent }: { listContent: React.ReactNode }) {
  const [view, setView] = useState<"list" | "calendar">("list");

  return (
    <div>
      <div className="flex items-center gap-1 mb-6 p-1 bg-slate-800/60 border border-white/8 rounded-xl w-fit">
        <button
          onClick={() => setView("list")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            view === "list" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <List className="w-3.5 h-3.5" /> Liste
        </button>
        <button
          onClick={() => setView("calendar")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            view === "calendar" ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <CalendarDays className="w-3.5 h-3.5" /> Calendrier
        </button>
      </div>
      {view === "list" ? listContent : <CalendrierAdmin />}
    </div>
  );
}
