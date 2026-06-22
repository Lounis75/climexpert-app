"use client";

import { useState, useMemo, type ReactNode } from "react";
import { Search, Download, Users, Contact, ShieldCheck, Mail, Megaphone } from "lucide-react";
import type { MarketingContact } from "@/lib/marketing";

function fmtDate(d: Date | string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function csvEscape(v: string | null) {
  const s = (v ?? "").replace(/"/g, '""');
  return /[",;\n]/.test(s) ? `"${s}"` : s;
}

export default function MarketingContacts({ contacts }: { contacts: MarketingContact[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"tous" | "prospect" | "client">("tous");
  const [consentOnly, setConsentOnly] = useState(false);
  const [emailOnly, setEmailOnly] = useState(false);
  const [arrFilter, setArrFilter] = useState("tous");
  const [villeFilter, setVilleFilter] = useState("toutes");
  const [contratFilter, setContratFilter] = useState(false);
  const [installFilter, setInstallFilter] = useState(false);
  const [sansSuiteFilter, setSansSuiteFilter] = useState(false);

  const villes = useMemo(
    () => [...new Set(contacts.map((c) => c.city).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b)),
    [contacts],
  );
  const arrondissements = useMemo(
    () => [...new Set(contacts.map((c) => c.arrondissement).filter((a): a is number => a != null))].sort((a, b) => a - b),
    [contacts],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return contacts.filter((c) => {
      if (typeFilter !== "tous" && c.type !== typeFilter) return false;
      if (consentOnly && !c.consentement) return false;
      if (emailOnly && !c.email) return false;
      if (arrFilter !== "tous" && String(c.arrondissement ?? "") !== arrFilter) return false;
      if (villeFilter !== "toutes" && (c.city ?? "") !== villeFilter) return false;
      if (contratFilter && !c.aContrat) return false;
      if (installFilter && !c.aInstallation) return false;
      if (sansSuiteFilter && !c.pasDeSuite) return false;
      if (q) {
        const hay = `${c.name} ${c.email ?? ""} ${c.phone} ${c.city ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [contacts, search, typeFilter, consentOnly, emailOnly, arrFilter, villeFilter, contratFilter, installFilter, sansSuiteFilter]);

  const stats = useMemo(() => ({
    total: contacts.length,
    prospects: contacts.filter((c) => c.type === "prospect").length,
    clients: contacts.filter((c) => c.type === "client").length,
    consent: contacts.filter((c) => c.consentement).length,
    email: contacts.filter((c) => c.email).length,
  }), [contacts]);

  function exportCsv() {
    const header = ["Type", "Nom", "Telephone", "Email", "Ville", "Arrondissement", "Contrat", "Installation", "Statut", "Consentement", "Date"];
    const lines = filtered.map((c) => [
      c.type, c.name, c.phone, c.email ?? "", c.city ?? "",
      c.arrondissement != null ? String(c.arrondissement) : "",
      c.aContrat ? "oui" : "non", c.aInstallation ? "oui" : "non",
      c.pasDeSuite ? "sans suite" : (c.statut ?? ""),
      c.consentement ? "oui" : "non", fmtDate(c.createdAt),
    ].map(csvEscape).join(";"));
    const csv = "﻿" + [header.join(";"), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts-climexpert-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const kpis = [
    { label: "Contacts", value: stats.total, icon: Users, color: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
    { label: "Prospects", value: stats.prospects, icon: Megaphone, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
    { label: "Clients", value: stats.clients, icon: Contact, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
    { label: "Consentement", value: stats.consent, icon: ShieldCheck, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
    { label: "Avec email", value: stats.email, icon: Mail, color: "text-slate-300 bg-slate-500/10 border-slate-500/20" },
  ];

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {kpis.map((k) => (
          <div key={k.label} className="bg-slate-800/40 border border-white/8 rounded-xl p-3">
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center mb-2 ${k.color}`}>
              <k.icon className="w-3.5 h-3.5" />
            </div>
            <p className="text-lg font-bold text-white tabular-nums">{k.value}</p>
            <p className="text-slate-400 text-xs">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Barre filtres + export */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un nom, email, ville…"
            className="w-full bg-slate-800/60 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(["tous", "prospect", "client"] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                typeFilter === t ? "bg-sky-500/15 border-sky-500/30 text-sky-300" : "bg-slate-800/60 border-white/10 text-slate-400 hover:text-white"
              }`}>
              {t === "tous" ? "Tous" : t === "prospect" ? "Prospects" : "Clients"}
            </button>
          ))}
          <button onClick={() => setConsentOnly((v) => !v)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              consentOnly ? "bg-amber-500/15 border-amber-500/30 text-amber-300" : "bg-slate-800/60 border-white/10 text-slate-400 hover:text-white"
            }`}>
            <ShieldCheck className="w-3.5 h-3.5" /> Consentement
          </button>
          <button onClick={() => setEmailOnly((v) => !v)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors flex items-center gap-1.5 ${
              emailOnly ? "bg-sky-500/15 border-sky-500/30 text-sky-300" : "bg-slate-800/60 border-white/10 text-slate-400 hover:text-white"
            }`}>
            <Mail className="w-3.5 h-3.5" /> Avec email
          </button>
          <button onClick={exportCsv}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-sky-500 hover:bg-sky-400 text-white flex items-center gap-1.5 transition-colors">
            <Download className="w-3.5 h-3.5" /> Export CSV ({filtered.length})
          </button>
        </div>
      </div>

      {/* Filtres de ciblage : géo + relation */}
      <div className="flex flex-wrap items-center gap-2">
        {arrondissements.length > 0 && (
          <select value={arrFilter} onChange={(e) => setArrFilter(e.target.value)}
            className="bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500/50">
            <option value="tous">Tous arrondissements</option>
            {arrondissements.map((a) => <option key={a} value={String(a)}>{a === 1 ? "1er" : `${a}e`} arr. (Paris)</option>)}
          </select>
        )}
        {villes.length > 0 && (
          <select value={villeFilter} onChange={(e) => setVilleFilter(e.target.value)}
            className="bg-slate-800/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 max-w-[180px] focus:outline-none focus:border-sky-500/50">
            <option value="toutes">Toutes villes / CP</option>
            {villes.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        )}
        <FilterToggle active={contratFilter} onClick={() => setContratFilter((v) => !v)} color="emerald">Contrat d&apos;entretien</FilterToggle>
        <FilterToggle active={installFilter} onClick={() => setInstallFilter((v) => !v)} color="sky">A eu une installation</FilterToggle>
        <FilterToggle active={sansSuiteFilter} onClick={() => setSansSuiteFilter((v) => !v)} color="rose">Sans suite</FilterToggle>
        {(arrFilter !== "tous" || villeFilter !== "toutes" || contratFilter || installFilter || sansSuiteFilter || consentOnly || emailOnly || typeFilter !== "tous" || search) && (
          <button
            onClick={() => { setArrFilter("tous"); setVilleFilter("toutes"); setContratFilter(false); setInstallFilter(false); setSansSuiteFilter(false); setConsentOnly(false); setEmailOnly(false); setTypeFilter("tous"); setSearch(""); }}
            className="text-xs text-slate-500 hover:text-white px-2 py-2 transition-colors">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Liste */}
      <div className="bg-slate-800/30 border border-white/8 rounded-2xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1.4fr_0.7fr_1.4fr_1fr_0.9fr_0.8fr] gap-3 px-4 py-2.5 border-b border-white/8 text-[11px] uppercase tracking-wide text-slate-500 font-medium">
          <span>Nom</span><span>Type</span><span>Email</span><span>Téléphone</span><span>Ville</span><span>Démarchage</span>
        </div>
        {filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-slate-500 text-sm">Aucun contact ne correspond.</p>
        ) : (
          <div className="divide-y divide-white/5">
            {filtered.map((c) => (
              <div key={`${c.type}-${c.id}`} className="grid grid-cols-2 sm:grid-cols-[1.4fr_0.7fr_1.4fr_1fr_0.9fr_0.8fr] gap-x-3 gap-y-1 px-4 py-3 text-sm hover:bg-white/[0.02]">
                <div className="min-w-0">
                  <span className="text-white font-medium truncate block">{c.name}</span>
                  {(c.aContrat || c.aInstallation || c.pasDeSuite) && (
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {c.aContrat && <span className="text-[9px] font-semibold px-1.5 py-px rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">Contrat</span>}
                      {c.aInstallation && <span className="text-[9px] font-semibold px-1.5 py-px rounded bg-sky-500/10 text-sky-400 border border-sky-500/25">Install</span>}
                      {c.pasDeSuite && <span className="text-[9px] font-semibold px-1.5 py-px rounded bg-rose-500/10 text-rose-400 border border-rose-500/25">Sans suite</span>}
                    </div>
                  )}
                </div>
                <span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    c.type === "client" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" : "bg-violet-500/10 text-violet-400 border-violet-500/30"
                  }`}>{c.type === "client" ? "Client" : "Prospect"}</span>
                </span>
                <span className="text-slate-300 truncate">{c.email ?? <span className="text-slate-600">—</span>}</span>
                <span className="text-slate-400 truncate">{c.phone}</span>
                <span className="text-slate-400 truncate">{c.city ?? <span className="text-slate-600">—</span>}</span>
                <span>
                  {c.consentement
                    ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">Autorisé</span>
                    : <span className="text-[10px] text-slate-500">—</span>}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Pour le démarchage à froid (prospects), n&apos;exportez que les contacts avec <span className="text-amber-400">consentement</span> (RGPD).
        Les clients existants peuvent être recontactés pour des services similaires.
      </p>
    </div>
  );
}

function FilterToggle({ active, onClick, color, children }: {
  active: boolean; onClick: () => void; color: "emerald" | "sky" | "rose"; children: ReactNode;
}) {
  const on = {
    emerald: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
    sky: "bg-sky-500/15 border-sky-500/30 text-sky-300",
    rose: "bg-rose-500/15 border-rose-500/30 text-rose-300",
  }[color];
  return (
    <button onClick={onClick}
      className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${active ? on : "bg-slate-800/60 border-white/10 text-slate-400 hover:text-white"}`}>
      {children}
    </button>
  );
}
