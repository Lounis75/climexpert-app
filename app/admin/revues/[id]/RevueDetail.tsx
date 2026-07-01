"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Check, X, User, Trash2, Plus, CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

type Line = { d: string; q: number; pu: number; tva: number };
type Revue = {
  id: string; status: string; description: string | null;
  clientSnapshot: Record<string, string> | null;
  lignes: Line[]; photosUrls: string[] | null; noteDemande: string | null;
  demandeParNom: string | null; noteExpert: string | null; revueParNom: string | null;
  revueLe: string | null; montantEnvoyeCt: number | null;
};

const inp = "bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-white text-sm focus:outline-none focus:border-sky-500/50";
const eur = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function RevueDetail({ revue }: { revue: Revue }) {
  const router = useRouter();
  const c = revue.clientSnapshot ?? {};
  const [lines, setLines] = useState<Line[]>(revue.lignes.map((l) => ({ ...l })));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"" | "valider" | "annuler">("");
  const [error, setError] = useState("");
  const readOnly = revue.status !== "en_attente";

  const totalTtc = lines.reduce((s, l) => s + (Number(l.q) || 0) * (Number(l.pu) || 0) * (1 + (Number(l.tva) || 0) / 100), 0);

  function patch(i: number, k: keyof Line, v: string) {
    setLines((ls) => ls.map((l, j) => (j === i ? { ...l, [k]: k === "d" ? v : Number(v) } : l)));
  }
  function removeLine(i: number) { setLines((ls) => ls.filter((_, j) => j !== i)); }
  function addLine() { setLines((ls) => [...ls, { d: "", q: 1, pu: 0, tva: 20 }]); }

  async function act(action: "valider" | "annuler") {
    if (action === "valider" && lines.length === 0) { setError("Le devis ne peut pas être vide."); return; }
    if (action === "valider" && !confirm("Valider et envoyer ce devis au client ?")) return;
    if (action === "annuler" && !confirm("Annuler cette demande d'avis ?")) return;
    setBusy(action); setError("");
    try {
      const res = await fetch(`/api/admin/revues/${revue.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, lignes: lines, noteExpert: note }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? "Erreur, réessayez."); return; }
      router.push("/admin/revues"); router.refresh();
    } catch { setError("Erreur réseau, réessayez."); }
    finally { setBusy(""); }
  }

  return (
    <div className="space-y-5">
      <Link href="/admin/revues" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-sm"><ArrowLeft className="w-4 h-4" /> Toutes les demandes</Link>

      {readOnly && (
        <div className={`rounded-xl p-4 border ${revue.status === "validee" ? "bg-emerald-500/10 border-emerald-400/30" : "bg-slate-800/40 border-white/10"}`}>
          <p className="text-white font-semibold text-sm flex items-center gap-2">
            {revue.status === "validee" ? <><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Validé et envoyé au client</> : <><XCircle className="w-4 h-4 text-slate-400" /> Demande annulée</>}
          </p>
          <p className="text-slate-400 text-xs mt-1">Par {revue.revueParNom ?? "?"}{revue.montantEnvoyeCt ? ` · ${eur(revue.montantEnvoyeCt / 100)} € TTC` : ""}{revue.noteExpert ? ` · ${revue.noteExpert}` : ""}</p>
        </div>
      )}

      {/* Client + demandeur */}
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
        <p className="text-white font-semibold flex items-center gap-2"><User className="w-4 h-4 text-sky-400" /> {c.nom || "Client"}</p>
        <div className="text-slate-400 text-sm mt-1 space-y-0.5">
          {c.email && <p>{c.email}</p>}
          {(c.adr || c.cp || c.ville) && <p>{[c.adr, c.cp, c.ville].filter(Boolean).join(", ")}</p>}
          <p className="text-slate-500 text-xs pt-1">{revue.description || "Devis"} · demande de {revue.demandeParNom ?? "?"}</p>
        </div>
        {revue.noteDemande && <p className="mt-3 text-sm text-slate-300 bg-slate-900/50 border border-white/10 rounded-lg p-3">« {revue.noteDemande} »</p>}
      </div>

      {/* Photos */}
      <div>
        <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2 flex items-center gap-1.5"><Camera className="w-3.5 h-3.5" /> Photos de l&apos;installation ({(revue.photosUrls ?? []).length})</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {(revue.photosUrls ?? []).map((u, i) => (
            <a key={i} href={u} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-white/10 hover:border-sky-500/50 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={u} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
            </a>
          ))}
        </div>
      </div>

      {/* Lignes du devis (éditables) */}
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
        <p className="text-white font-semibold text-sm mb-3">Lignes du devis {!readOnly && <span className="text-slate-500 font-normal">(modifiables)</span>}</p>
        <div className="space-y-2">
          <div className="hidden sm:grid grid-cols-[1fr_60px_90px_70px_90px_32px] gap-2 text-[11px] uppercase tracking-wide text-slate-500 font-semibold px-1">
            <span>Désignation</span><span className="text-right">Qté</span><span className="text-right">PU €</span><span className="text-right">TVA %</span><span className="text-right">Total TTC</span><span />
          </div>
          {lines.map((l, i) => {
            const totLigne = (Number(l.q) || 0) * (Number(l.pu) || 0) * (1 + (Number(l.tva) || 0) / 100);
            return (
              <div key={i} className="grid grid-cols-2 sm:grid-cols-[1fr_60px_90px_70px_90px_32px] gap-2 items-center">
                <input value={l.d} onChange={(e) => patch(i, "d", e.target.value)} disabled={readOnly} className={`${inp} col-span-2 sm:col-span-1`} />
                <input type="number" value={l.q} onChange={(e) => patch(i, "q", e.target.value)} disabled={readOnly} className={`${inp} text-right`} />
                <input type="number" value={l.pu} onChange={(e) => patch(i, "pu", e.target.value)} disabled={readOnly} className={`${inp} text-right`} />
                <input type="number" value={l.tva} onChange={(e) => patch(i, "tva", e.target.value)} disabled={readOnly} className={`${inp} text-right`} />
                <span className="text-slate-300 text-sm text-right tabular-nums">{eur(totLigne)}</span>
                {!readOnly ? <button onClick={() => removeLine(i)} className="text-slate-500 hover:text-red-400 flex justify-end"><Trash2 className="w-4 h-4" /></button> : <span />}
              </div>
            );
          })}
        </div>
        {!readOnly && <button onClick={addLine} className="mt-3 text-sky-400 hover:text-sky-300 text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Ajouter une ligne</button>}
        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-baseline">
          <span className="text-slate-400 text-sm">Total TTC</span>
          <span className="text-white text-xl font-bold tabular-nums">{eur(totalTtc)} €</span>
        </div>
      </div>

      {!readOnly && (
        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5 space-y-3">
          <div>
            <label className="text-slate-400 text-xs block mb-1">Commentaire (facultatif, tracé en interne)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Ex. : validé, ou correction du prix de la pose…" className={`${inp} w-full resize-none`} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => act("valider")} disabled={!!busy} className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
              <Check className="w-4 h-4" /> {busy === "valider" ? "Envoi au client…" : "Valider et envoyer au client"}
            </button>
            <button onClick={() => act("annuler")} disabled={!!busy} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-800 border border-white/10 hover:border-red-400/40 hover:text-red-300 text-slate-300 text-sm font-semibold transition-colors">
              <X className="w-4 h-4" /> Annuler la demande
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
