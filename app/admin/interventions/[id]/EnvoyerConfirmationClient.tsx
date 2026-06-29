"use client";

import { useState } from "react";
import { Mail, Check } from "lucide-react";

// Bouton d'envoi MANUEL de la confirmation d'intervention au client par e-mail (sur la fiche).
export default function EnvoyerConfirmationClient({ id, hasEmail, hasSchedule }: { id: string; hasEmail: boolean; hasSchedule: boolean }) {
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function send() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/interventions/${id}/confirmer`, { method: "POST" });
      const d = await res.json().catch(() => ({}));
      if (res.ok) setSent(true);
      else alert(d.error ?? "L'e-mail n'a pas pu être envoyé.");
    } catch { alert("Erreur réseau, réessayez."); }
    finally { setBusy(false); }
  }

  if (!hasSchedule) return null;

  return (
    <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-5">
      <p className="text-slate-400 text-xs font-medium mb-3 uppercase tracking-wide flex items-center gap-1.5">
        <Mail className="w-3.5 h-3.5 text-sky-400" /> Confirmation client
      </p>
      {sent ? (
        <p className="text-emerald-300 text-sm flex items-center gap-2"><Check className="w-4 h-4 flex-shrink-0" /> Confirmation envoyée au client par e-mail</p>
      ) : hasEmail ? (
        <button onClick={send} disabled={busy} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
          <Mail className="w-4 h-4" /> {busy ? "Envoi…" : "Envoyer la confirmation au client"}
        </button>
      ) : (
        <p className="text-slate-500 text-sm">Ce client n&apos;a pas d&apos;e-mail : ajoute-le sur sa fiche pour pouvoir envoyer la confirmation.</p>
      )}
    </div>
  );
}
