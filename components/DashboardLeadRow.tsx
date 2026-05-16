"use client";

import { useState } from "react";
import { Phone, Mail, Bot, MessageSquare, Wrench, MapPin, Clock } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  source: string | null;
  status: string;
  project?: string | null;
  location?: string | null;
  createdAt: Date | string;
}

const STATUS_COLORS: Record<string, string> = {
  nouveau:      "bg-sky-500/10 text-sky-400 border-sky-500/30",
  contacté:     "bg-amber-500/10 text-amber-400 border-amber-500/30",
  devis_envoyé: "bg-violet-500/10 text-violet-400 border-violet-500/30",
  gagné:        "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  perdu:        "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

const STATUS_LABELS: Record<string, string> = {
  nouveau: "Nouveau", contacté: "Contacté", devis_envoyé: "Devis envoyé",
  gagné: "Gagné", perdu: "Perdu",
};

const PROJECT_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Autre",
};

function timeAgo(d: Date | string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "À l'instant";
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}j`;
}

export default function DashboardLeadRow({ lead }: { lead: Lead }) {
  const [showPhone, setShowPhone] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  return (
    <div className="px-5 py-3.5 flex items-center gap-3 hover:bg-white/3 transition-colors">
      {/* Source icon */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
        lead.source === "alex" ? "bg-sky-500/10 text-sky-400" : "bg-violet-500/10 text-violet-400"
      }`}>
        {lead.source === "alex" ? <Bot className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white text-sm font-medium">{lead.name}</span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_COLORS[lead.status] ?? ""}`}>
            {STATUS_LABELS[lead.status] ?? lead.status}
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

      {/* Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Phone */}
        {showPhone ? (
          <a
            href={`tel:${lead.phone}`}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-medium hover:bg-sky-500/25 transition-colors whitespace-nowrap"
          >
            <Phone className="w-3 h-3 flex-shrink-0" />
            {lead.phone}
          </a>
        ) : (
          <button
            onClick={() => setShowPhone(true)}
            className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 hover:bg-sky-500/20 flex items-center justify-center transition-colors"
            title="Afficher le téléphone"
          >
            <Phone className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Email */}
        {lead.email && (
          showEmail ? (
            <a
              href={`mailto:${lead.email}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-violet-500/15 border border-violet-500/30 text-violet-300 text-xs font-medium hover:bg-violet-500/25 transition-colors whitespace-nowrap max-w-[180px] truncate"
            >
              <Mail className="w-3 h-3 flex-shrink-0" />
              {lead.email}
            </a>
          ) : (
            <button
              onClick={() => setShowEmail(true)}
              className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 flex items-center justify-center transition-colors"
              title="Afficher l'email"
            >
              <Mail className="w-3 h-3.5" />
            </button>
          )
        )}
      </div>
    </div>
  );
}
