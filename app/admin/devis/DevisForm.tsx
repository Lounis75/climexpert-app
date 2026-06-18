"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, FileText, X, Check } from "lucide-react";
import Link from "next/link";
import type { Client } from "@/lib/db/schema";

type Prospect = { id: string; name: string; location: string | null };

export default function DevisForm({ clients, prospects }: { clients: Client[]; prospects: Prospect[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  // Cible du devis : un prospect (lead) OU un client existant
  const [mode, setMode] = useState<"prospect" | "client">(prospects.length > 0 ? "prospect" : "client");
  const [cibleId, setCibleId] = useState(prospects[0]?.id ?? clients[0]?.id ?? "");
  const [objet, setObjet] = useState("");
  const [montant, setMontant] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [fichierUrl, setFichierUrl] = useState<string | null>(null);
  const [fichierNom, setFichierNom] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function uploadPdf(file: File) {
    if (file.type !== "application/pdf") { setError("Le devis doit être un PDF."); return; }
    setError("");
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/devis", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) { setError(data.error ?? "Échec de l'envoi du PDF."); return; }
      setFichierUrl(data.url);
      setFichierNom(file.name);
    } catch {
      setError("Erreur réseau pendant l'envoi du PDF.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!cibleId) { setError(mode === "prospect" ? "Sélectionnez un prospect" : "Sélectionnez un client"); return; }
    const montantNum = parseFloat(montant);
    if (!Number.isFinite(montantNum) || montantNum <= 0) { setError("Renseignez le montant du devis."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          [mode === "prospect" ? "leadId" : "clientId"]: cibleId,
          description: objet || undefined,
          validUntil: validUntil || undefined,
          // Devis simple : une seule "ligne" = le montant total (le détail est dans le PDF joint).
          lignes: [{ designation: objet || "Prestation climatisation", quantite: 1, prixUnitaireEuros: montantNum, tvaRate: "0" }],
          fichierUrl: fichierUrl ?? undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Erreur");
        return;
      }
      const { devis } = await res.json();
      router.push(`/admin/devis/${devis.id}`);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/devis" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Nouveau devis</h1>
      </div>

      <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-6 space-y-4">

        {/* Destinataire */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Destinataire *</label>
          <div className="flex gap-1.5 mb-2">
            {(["prospect", "client"] as const).map((m) => (
              <button key={m} type="button"
                onClick={() => { setMode(m); setCibleId(m === "prospect" ? (prospects[0]?.id ?? "") : (clients[0]?.id ?? "")); }}
                className={`flex-1 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                  mode === m ? "border-sky-500/60 bg-sky-500/10 text-sky-300" : "border-white/10 bg-slate-900/60 text-slate-400 hover:border-white/20"
                }`}>
                {m === "prospect" ? "Prospect" : "Client existant"}
              </button>
            ))}
          </div>
          <select
            value={cibleId}
            onChange={(e) => setCibleId(e.target.value)}
            required
            className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
          >
            <option value="">{mode === "prospect" ? "Sélectionner un prospect" : "Sélectionner un client"}</option>
            {(mode === "prospect" ? prospects : clients).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} {("location" in c ? c.location : ("city" in c ? c.city : null)) ? `— ${("location" in c ? c.location : (c as Client).city)}` : ""}
              </option>
            ))}
          </select>
          {mode === "prospect" && (
            <p className="text-slate-500 text-[11px] mt-1">Le prospect deviendra client automatiquement à la signature.</p>
          )}
        </div>

        {/* Montant + validité */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Montant du devis (€ TTC) *</label>
            <input
              type="number" min="0" step="1"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              required
              placeholder="ex : 3500"
              className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Valable jusqu&apos;au</label>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-all [color-scheme:dark]"
            />
          </div>
        </div>

        {/* Objet */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Objet</label>
          <input
            type="text"
            value={objet}
            onChange={(e) => setObjet(e.target.value)}
            placeholder="Ex : Installation climatiseur bi-split Daikin, appartement 75m²"
            className="w-full h-11 px-3 rounded-xl bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>

        {/* PDF du devis (glisser-déposer) */}
        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Le vrai devis (PDF)</label>
          {fichierUrl ? (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl px-4 py-3">
              <FileText className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-emerald-200 text-sm truncate flex-1">{fichierNom}</span>
              <Check className="w-4 h-4 text-emerald-400" />
              <button type="button" onClick={() => { setFichierUrl(null); setFichierNom(null); }} className="text-slate-400 hover:text-red-400">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) uploadPdf(f); }}
              onClick={() => fileRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl py-8 cursor-pointer transition-colors ${
                dragOver ? "border-sky-500/60 bg-sky-500/5" : "border-white/15 hover:border-white/30"
              }`}
            >
              <Upload className="w-5 h-5 text-slate-400" />
              <p className="text-slate-400 text-sm">{uploading ? "Envoi…" : "Glissez-déposez le PDF ici, ou cliquez"}</p>
              <p className="text-slate-600 text-[11px]">Facultatif — vous pourrez l&apos;ajouter plus tard.</p>
              <input ref={fileRef} type="file" accept="application/pdf" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPdf(f); }} />
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Link href="/admin/devis" className="px-5 py-2.5 text-slate-400 hover:text-white border border-white/10 rounded-xl text-sm transition-colors">
          Annuler
        </Link>
        <button
          type="submit"
          disabled={loading || uploading}
          className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white font-semibold text-sm rounded-xl transition-all"
        >
          {loading ? "Création…" : "Créer le devis"}
        </button>
      </div>
    </form>
  );
}
