"use client";

import { useState } from "react";
import type { Lead } from "@/lib/leads";
import type { LeadTache } from "@/lib/qualification";
import { CheckCircle2, Clock, AlertTriangle, Plus, X, ListChecks, GitCommitVertical } from "lucide-react";

type DevisItem = { id: string; montantCt: number | null; envoyeLe: string; decision: string | null };

const fmtDateTime = (d?: string | Date | null) => (d ? new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "");
const fmtDate = (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "");
const euros = (ct?: number | null) => (ct ? `${(ct / 100).toLocaleString("fr-FR")} €` : "");
const tid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

const DOT: Record<string, string> = { sky: "bg-sky-400 border-sky-400", violet: "bg-violet-400 border-violet-400", emerald: "bg-emerald-400 border-emerald-400", red: "bg-red-400 border-red-400", slate: "bg-slate-500 border-slate-500" };
const PRESETS = ["Relancer", "Visite client", "Appeler", "Envoyer un devis", "Métrage"];

// Parcours client : une frise verticale des jalons (reçu, devis, visite, gagné) + un bloc
// « Tâches à effectuer » (actions auto déduites des champs + tâches manuelles cochables).
export default function LeadParcours({ lead, devisHist, onSaveTaches }: {
  lead: Lead;
  devisHist: DevisItem[];
  onSaveTaches: (t: LeadTache[]) => void;
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newDate, setNewDate] = useState("");
  const taches: LeadTache[] = lead.taches ?? [];
  const now = new Date();

  // ── Frise : jalons datés ──
  type Node = { key: string; date: Date | null; title: string; sub?: string; done: boolean; color: string };
  const nodes: Node[] = [
    { key: "recu", date: lead.createdAt ? new Date(lead.createdAt) : null, title: "Prospect reçu", sub: lead.source === "alex" ? "Via Alex" : lead.source === "formulaire" ? "Formulaire" : lead.source === "whatsapp" ? "WhatsApp" : "Téléphone", done: true, color: "sky" },
  ];
  [...devisHist].reverse().forEach((d, i) => {
    nodes.push({
      key: `d-${d.id}`,
      date: d.envoyeLe ? new Date(d.envoyeLe) : null,
      title: `Devis ${i + 1} envoyé`,
      sub: `${euros(d.montantCt)}${d.decision === "accepte" ? " · accepté" : d.decision === "refuse" ? " · décliné" : " · en attente"}`,
      done: true,
      color: d.decision === "accepte" ? "emerald" : d.decision === "refuse" ? "red" : "violet",
    });
  });
  if (lead.visiteClientLe) {
    nodes.push({ key: "visite", date: new Date(lead.visiteClientLe), title: "Visite client", sub: fmtDateTime(lead.visiteClientLe), done: new Date(lead.visiteClientLe) < now, color: "sky" });
  }
  if (lead.status === "gagné" && lead.gagneLe) {
    nodes.push({ key: "gagne", date: new Date(lead.gagneLe), title: "Gagné", sub: "Client signé", done: true, color: "emerald" });
  }
  if (lead.status === "perdu") {
    nodes.push({ key: "perdu", date: lead.statutChangeLe ? new Date(lead.statutChangeLe) : null, title: "Perdu", sub: lead.motifPerdu === "pas_de_business" ? "Hors activité" : undefined, done: true, color: "slate" });
  }
  nodes.sort((a, b) => (a.date?.getTime() ?? Infinity) - (b.date?.getTime() ?? Infinity));

  // ── Tâches auto (prochaines actions déduites des champs) ──
  const auto: { label: string; sub?: string; urgent: boolean }[] = [];
  if (lead.prochaineActionLe) {
    const due = new Date(lead.prochaineActionLe) <= now;
    auto.push({ label: "Relancer le prospect", sub: fmtDate(lead.prochaineActionLe), urgent: due });
  }
  if (lead.visiteClientLe && new Date(lead.visiteClientLe) >= now) {
    auto.push({ label: "Visite client", sub: fmtDateTime(lead.visiteClientLe), urgent: false });
  }
  const devisEnAttente = devisHist.some((d) => !d.decision) || (lead.status === "devis_envoyé" && !lead.devisDecision);
  if (devisEnAttente && (devisHist.length > 0 || lead.devisEnvoyeLe)) auto.push({ label: "Relancer le devis (en attente de réponse)", urgent: false });
  if ((lead.status === "devis_envoyé" || lead.status === "gagné") && !lead.montantDevisCt) auto.push({ label: "Renseigner le montant du devis", urgent: true });
  if (lead.status === "gagné" && !lead.clientId) auto.push({ label: "Créer l'intervention", urgent: true });

  function addTache() {
    const label = newLabel.trim();
    if (!label) return;
    onSaveTaches([...taches, { id: tid(), label, dueDate: newDate || null, fait: false }]);
    setNewLabel(""); setNewDate("");
  }
  function toggle(id: string) { onSaveTaches(taches.map((t) => (t.id === id ? { ...t, fait: !t.fait } : t))); }
  function remove(id: string) { onSaveTaches(taches.filter((t) => t.id !== id)); }

  const aFaire = taches.filter((t) => !t.fait);
  const faites = taches.filter((t) => t.fait);

  return (
    <div className="space-y-5">
      {/* ── Frise du parcours ── */}
      <div>
        <p className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-wide flex items-center gap-1.5">
          <GitCommitVertical className="w-3.5 h-3.5" /> Parcours client
        </p>
        <ol className="relative ml-1.5 border-l border-white/10 space-y-3">
          {nodes.map((n) => (
            <li key={n.key} className="relative pl-4">
              <span className={`absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full border ${n.done ? DOT[n.color] : "bg-slate-900 border-slate-600"}`} />
              <div className="flex items-baseline justify-between gap-2">
                <p className={`text-sm font-medium ${n.done ? "text-white" : "text-slate-400"}`}>{n.title}</p>
                {n.date && <span className="text-slate-500 text-[11px] flex-shrink-0">{fmtDate(n.date)}</span>}
              </div>
              {n.sub && <p className="text-slate-500 text-xs">{n.sub}</p>}
            </li>
          ))}
        </ol>
      </div>

      {/* ── Tâches à effectuer ── */}
      <div className="rounded-xl border border-white/10 bg-slate-900/30 p-3.5">
        <p className="text-slate-300 text-xs font-semibold mb-2.5 uppercase tracking-wide flex items-center gap-1.5">
          <ListChecks className="w-3.5 h-3.5 text-sky-400" /> Tâches à effectuer
        </p>

        {/* Actions auto (déduites) */}
        {auto.length > 0 && (
          <div className="space-y-1 mb-3">
            {auto.map((a, i) => (
              <div key={i} className={`flex items-center gap-2 text-sm rounded-lg px-2.5 py-1.5 ${a.urgent ? "bg-red-500/10 text-red-300" : "bg-slate-800/50 text-slate-300"}`}>
                {a.urgent ? <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> : <Clock className="w-3.5 h-3.5 flex-shrink-0 text-slate-500" />}
                <span className="flex-1 min-w-0">{a.label}</span>
                {a.sub && <span className="text-[11px] opacity-70 flex-shrink-0">{a.sub}</span>}
              </div>
            ))}
          </div>
        )}

        {/* Tâches manuelles à faire */}
        {aFaire.length > 0 && (
          <div className="space-y-1 mb-2">
            {aFaire.map((t) => {
              const overdue = t.dueDate ? new Date(t.dueDate) < new Date(new Date().toDateString()) : false;
              return (
                <div key={t.id} className="flex items-center gap-2 group">
                  <button onClick={() => toggle(t.id)} title="Marquer fait" className="w-4 h-4 rounded border border-slate-500 hover:border-sky-400 flex-shrink-0" />
                  <span className="flex-1 min-w-0 text-sm text-slate-200 truncate">{t.label}</span>
                  {t.dueDate && <span className={`text-[11px] flex-shrink-0 ${overdue ? "text-red-400" : "text-slate-500"}`}>{fmtDate(t.dueDate)}</span>}
                  <button onClick={() => remove(t.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                </div>
              );
            })}
          </div>
        )}

        {/* Ajout d'une tâche */}
        <div className="flex items-center gap-1.5 mt-1">
          <input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTache(); }}
            placeholder="Ajouter une tâche…"
            className="flex-1 min-w-0 bg-slate-800/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
          />
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            title="Échéance (facultatif)"
            className="bg-slate-800/60 border border-white/10 rounded-lg px-2 py-1.5 text-slate-300 text-xs [color-scheme:dark] focus:outline-none focus:border-sky-500/50 w-[120px]"
          />
          <button onClick={addTache} disabled={!newLabel.trim()} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white transition-colors"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {PRESETS.map((p) => (
            <button key={p} onClick={() => setNewLabel(p)} className="px-2 py-0.5 rounded-full bg-slate-800/60 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-[11px] transition-colors">{p}</button>
          ))}
        </div>

        {/* Tâches faites */}
        {faites.length > 0 && (
          <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1">
            {faites.map((t) => (
              <div key={t.id} className="flex items-center gap-2 group">
                <button onClick={() => toggle(t.id)} title="Rouvrir" className="w-4 h-4 rounded bg-emerald-500/80 flex items-center justify-center flex-shrink-0"><CheckCircle2 className="w-3 h-3 text-white" /></button>
                <span className="flex-1 min-w-0 text-sm text-slate-500 line-through truncate">{t.label}</span>
                <button onClick={() => remove(t.id)} className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
