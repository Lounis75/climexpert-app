"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Receipt, Send, Upload, X, Check, FileText } from "lucide-react";

const TRANSITIONS: Record<string, string[]> = {
  brouillon:  ["envoyé"],
  envoyé:     ["accepté", "refusé", "expiré"],
  accepté:    [],
  refusé:     [],
  expiré:     [],
};

const STATUS_LABELS: Record<string, string> = {
  accepté: "Marquer accepté",
  refusé:  "Marquer refusé",
  expiré:  "Marquer expiré",
};

interface Props {
  id: string;
  currentStatus: string;
  currentHtEuros?: number;
  currentTtcEuros?: number;
  currentFichierUrl?: string | null;
}

export default function DevisActions({ id, currentStatus, currentHtEuros, currentTtcEuros, currentFichierUrl }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [converting, setConverting] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [ht, setHt] = useState(currentHtEuros ? String(currentHtEuros) : "");
  const [ttc, setTtc] = useState(currentTtcEuros ? String(currentTtcEuros) : "");
  const [fichierUrl, setFichierUrl] = useState(currentFichierUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const next = TRANSITIONS[currentStatus] ?? [];

  async function changeStatus(status: string) {
    setLoading(true);
    try {
      await fetch(`/api/admin/devis/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally { setLoading(false); }
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload/devis", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setFichierUrl(data.url);
    } finally { setUploading(false); }
  }

  async function confirmSend() {
    setLoading(true);
    try {
      await fetch(`/api/admin/devis/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "envoyé", montantHtEuros: ht, montantTtcEuros: ttc, fichierUrl }),
      });
      setSendOpen(false);
      router.refresh();
    } finally { setLoading(false); }
  }

  async function convertirEnFacture() {
    setConverting(true);
    try {
      const res = await fetch("/api/admin/factures", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ devisId: id }),
      });
      if (res.ok) { const { facture } = await res.json(); router.push(`/admin/factures/${facture.id}`); }
    } finally { setConverting(false); }
  }

  return (
    <div className="flex flex-col items-end gap-3">
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {next.includes("envoyé") && (
          <button onClick={() => setSendOpen((v) => !v)} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 text-xs font-medium rounded-xl transition-all disabled:opacity-40">
            <Send className="w-3.5 h-3.5" /> Marquer envoyé
          </button>
        )}
        {next.filter((s) => s !== "envoyé").map((s) => (
          <button key={s} onClick={() => changeStatus(s)} disabled={loading || converting}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 border border-white/10 text-slate-300 hover:text-white hover:border-white/20 text-xs font-medium rounded-xl transition-all disabled:opacity-40">
            <ChevronDown className="w-3.5 h-3.5" /> {STATUS_LABELS[s] ?? s}
          </button>
        ))}
        {currentStatus === "accepté" && (
          <button onClick={convertirEnFacture} disabled={converting || loading}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 text-xs font-medium rounded-xl transition-all disabled:opacity-40">
            <Receipt className="w-3.5 h-3.5" /> {converting ? "Création…" : "Convertir en facture"}
          </button>
        )}
      </div>

      {sendOpen && (
        <div className="w-full sm:w-96 bg-slate-800/60 border border-sky-500/20 rounded-2xl p-4 space-y-3">
          <p className="text-sky-300 text-xs font-semibold flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5" /> Envoyer le devis
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-400 text-xs block mb-1">Montant HT (€)</label>
              <input type="number" step="0.01" value={ht} onChange={(e) => setHt(e.target.value)} placeholder="0,00"
                className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm focus:outline-none focus:border-sky-500/50" />
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1">Montant TTC (€)</label>
              <input type="number" step="0.01" value={ttc} onChange={(e) => setTtc(e.target.value)} placeholder="optionnel"
                className="w-full bg-slate-900/60 border border-white/10 rounded-lg px-2.5 py-2 text-white text-sm focus:outline-none focus:border-sky-500/50" />
            </div>
          </div>
          {/* Dépôt du fichier */}
          <input ref={fileRef} type="file" accept="application/pdf,image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
          {fichierUrl ? (
            <div className="flex items-center gap-2 bg-slate-900/60 border border-white/10 rounded-lg px-3 py-2">
              <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <a href={fichierUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-300 text-xs truncate flex-1 hover:underline">Devis joint</a>
              <button onClick={() => setFichierUrl("")} className="text-slate-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
            </div>
          ) : (
            <div onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) uploadFile(f); }}
              className="flex items-center justify-center gap-2 border-2 border-dashed border-white/15 hover:border-white/30 rounded-lg py-4 cursor-pointer text-slate-400 text-xs transition-colors">
              {uploading ? <span className="w-4 h-4 border-2 border-sky-400/40 border-t-sky-400 rounded-full animate-spin" /> : <Upload className="w-4 h-4" />}
              {uploading ? "Envoi…" : "Glissez le PDF du devis ou cliquez"}
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setSendOpen(false)} className="flex-1 px-3 py-2 border border-white/10 text-slate-400 hover:text-white rounded-lg text-xs font-medium">Annuler</button>
            <button onClick={confirmSend} disabled={loading || uploading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-lg text-xs">
              {loading ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              Marquer envoyé
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
