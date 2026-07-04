"use client";

import { useState } from "react";
import { PhoneCall, CheckCircle2 } from "lucide-react";

// Mini-formulaire de secours affiché dans le chat quand Alex (l'IA) est en panne :
// capte nom + téléphone pour ne perdre aucun prospect pendant l'incident.
export default function ChatSosForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (phone.replace(/\D/g, "").length < 8) { setError("Entrez un numéro de téléphone valide."); return; }
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/chat/sos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? "Envoi impossible, appelez-nous directement."); return; }
      setSent(true);
    } catch { setError("Erreur réseau. Appelez-nous directement au 06 67 43 27 67."); }
    finally { setBusy(false); }
  }

  if (sent) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-2.5">
        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
        <p className="text-emerald-800 text-sm">C&apos;est noté ! Un conseiller vous rappelle rapidement.</p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 space-y-2">
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Votre prénom et nom"
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400" />
      <input type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Votre téléphone *"
        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-base text-slate-800 placeholder-slate-400 focus:outline-none focus:border-sky-400" />
      {error && <p className="text-red-600 text-xs">{error}</p>}
      <button onClick={submit} disabled={busy}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
        <PhoneCall className="w-4 h-4" /> {busy ? "Envoi…" : "Être rappelé rapidement"}
      </button>
    </div>
  );
}
