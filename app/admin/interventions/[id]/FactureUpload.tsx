"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, X, CheckCircle2, Receipt } from "lucide-react";

// Facturation côté admin : glisser-déposer le PDF de facture (fait sur le logiciel compta),
// envoi au client par e-mail (PDF + RIB) + dépôt sur la fiche/portail. Miroir du flux devis.
export default function FactureUpload({ interventionId, factureUrl, factureEnvoyeeLe, hasEmail }: {
  interventionId: string;
  factureUrl: string | null;
  factureEnvoyeeLe: string | null;
  hasEmail: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);
  const [marking, setMarking] = useState(false);

  // Marquer/démarquer la facture comme déjà envoyée hors système (logiciel comptable).
  async function markFacture(action: "mark_externe" | "unmark") {
    setMarking(true);
    try {
      const res = await fetch(`/api/admin/interventions/${interventionId}/facture`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); alert(d.error ?? "Échec, réessayez."); return; }
      router.refresh();
    } catch { alert("Erreur réseau, réessayez."); }
    finally { setMarking(false); }
  }

  async function send() {
    if (!file) return;
    setSending(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (message.trim()) fd.append("message", message.trim());
      const res = await fetch(`/api/admin/interventions/${interventionId}/facture`, { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? "Échec de l'envoi."); return; }
      setOpen(false);
      router.refresh();
    } catch { setError("Erreur réseau, réessayez."); }
    finally { setSending(false); }
  }

  return (
    <>
      <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
        <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide flex items-center gap-1.5">
          <Receipt className="w-3.5 h-3.5 text-emerald-400" /> Facturation
        </p>
        {factureEnvoyeeLe ? (
          factureUrl ? (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Facture envoyée le {new Date(factureEnvoyeeLe).toLocaleDateString("fr-FR")}
              </span>
              <div className="flex items-center gap-3 flex-shrink-0">
                <a href={factureUrl} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:text-sky-300 text-xs font-medium">Voir le PDF</a>
                <button onClick={() => { setFile(null); setError(""); setMessage(""); setOpen(true); }} className="text-slate-400 hover:text-white text-xs font-medium">Renvoyer</button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <span className="text-emerald-300 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Facture déjà envoyée le {new Date(factureEnvoyeeLe).toLocaleDateString("fr-FR")} <span className="text-slate-500">· depuis votre logiciel compta</span>
              </span>
              <button onClick={() => markFacture("unmark")} disabled={marking} className="text-slate-400 hover:text-red-400 disabled:opacity-50 text-xs font-medium flex-shrink-0">Annuler</button>
            </div>
          )
        ) : (
          <>
            <button
              onClick={() => { setFile(null); setError(""); setMessage(""); setOpen(true); }}
              disabled={!hasEmail}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              <FileText className="w-4 h-4" /> Envoyer la facture au client
            </button>
            <button
              onClick={() => markFacture("mark_externe")}
              disabled={marking}
              className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 disabled:opacity-50 text-sm font-medium transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> {marking ? "…" : "Marquer comme déjà envoyée (logiciel compta)"}
            </button>
            {!hasEmail && <p className="text-slate-500 text-[11px] mt-2">Pas d&apos;e-mail client : tu peux quand même la marquer comme déjà envoyée.</p>}
          </>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2"><Receipt className="w-4 h-4 text-emerald-400" /> Envoyer la facture</h2>
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-slate-400 text-xs leading-relaxed">Glisse le PDF de ta facture (fait sur ton logiciel compta). Le client la reçoit par e-mail avec le <span className="text-white">RIB</span> pour le règlement, et la retrouve sur son espace client.</p>
              <label
                onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f && f.type === "application/pdf") { setFile(f); setError(""); } else setError("Le fichier doit être un PDF."); }}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer transition-colors ${drag ? "border-emerald-500 bg-emerald-500/10" : file ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/15 hover:border-white/30 bg-slate-900/40"}`}
              >
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(""); } }} />
                {file ? (
                  <><CheckCircle2 className="w-7 h-7 text-emerald-400" /><span className="text-white text-sm font-medium text-center break-all px-2">{file.name}</span><span className="text-slate-500 text-xs">Cliquer pour changer</span></>
                ) : (
                  <><FileText className="w-7 h-7 text-slate-500" /><span className="text-slate-300 text-sm">Glisser le PDF ici, ou cliquer</span><span className="text-slate-500 text-xs">PDF, 10 Mo max</span></>
                )}
              </label>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Mot d&apos;accompagnement — facultatif</label>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Merci de régler sous 30 jours…" className="w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-none" />
              </div>
              {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
              <button onClick={send} disabled={sending || !file} className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-white text-sm font-semibold transition-colors">
                {sending ? "Envoi en cours…" : "Envoyer la facture au client"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
