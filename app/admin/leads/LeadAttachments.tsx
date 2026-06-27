"use client";

import { useState, useRef } from "react";
import { ImagePlus, X, Loader2, FileText } from "lucide-react";

const isPdf = (url: string) => /\.pdf($|\?)/i.test(url);

/** Pièces jointes internes d'un prospect (photos / PDF), propres au dossier. */
export default function LeadAttachments({ leadId, initial }: { leadId: string; initial: string[] }) {
  const [pieces, setPieces] = useState<string[]>(initial);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError("");
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch(`/api/admin/leads/${leadId}/pieces`, { method: "POST", body: fd });
        if (res.status === 401) { window.location.href = "/admin"; return; }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) { setError(data.error ?? "Échec de l'envoi"); break; }
        setPieces(data.pieces);
      }
    } catch {
      setError("Échec de l'envoi");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove(url: string) {
    const res = await fetch(`/api/admin/leads/${leadId}/pieces?url=${encodeURIComponent(url)}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setPieces(data.pieces);
  }

  return (
    <div>
      <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wide flex items-center gap-1.5">
        <ImagePlus className="w-3 h-3" /> Pièces jointes{pieces.length > 0 ? ` (${pieces.length})` : ""}
      </p>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); onFiles(e.dataTransfer.files); }}
        className={`grid grid-cols-3 gap-2 rounded-xl transition-colors ${dragging ? "ring-2 ring-sky-500/60" : ""}`}
      >
        {pieces.map((url) => (
          <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border border-white/10 bg-slate-900/60">
            {isPdf(url) ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="w-full h-full flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-white transition-colors p-1">
                <FileText className="w-6 h-6" />
                <span className="text-[9px] font-semibold">PDF</span>
              </a>
            ) : (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Pièce jointe" className="w-full h-full object-cover" loading="lazy" />
                <a href={url} target="_blank" rel="noopener noreferrer" className="absolute inset-0" aria-label="Agrandir" />
              </>
            )}
            <button type="button" onClick={() => remove(url)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Supprimer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        <button type="button" onClick={() => inputRef.current?.click()} disabled={uploading}
          className="aspect-square rounded-lg border border-dashed border-white/15 bg-slate-900/40 text-slate-400 hover:text-white hover:border-white/30 flex flex-col items-center justify-center gap-1 transition-colors disabled:opacity-50">
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
          <span className="text-[10px]">{uploading ? "Envoi…" : "Ajouter"}</span>
        </button>
      </div>
      <input ref={inputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
      <p className="text-slate-600 text-[10px] mt-1.5">Photos ou PDF ajoutés au dossier (max 10 Mo), visibles uniquement en interne.</p>
    </div>
  );
}
