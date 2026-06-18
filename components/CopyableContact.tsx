"use client";

import { useState } from "react";
import { Phone, Mail, Copy, Check } from "lucide-react";

function CopyRow({ icon: Icon, value, href }: { icon: typeof Phone; value: string; href: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard indisponible */ }
  }
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
      <a href={href} className="text-slate-200 text-sm hover:text-sky-300 transition-colors truncate">{value}</a>
      <button
        type="button"
        onClick={copy}
        title="Copier"
        className="ml-auto flex-shrink-0 w-6 h-6 rounded-md border border-white/10 bg-slate-900/40 text-slate-400 hover:text-white hover:border-white/25 flex items-center justify-center transition-colors"
      >
        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      </button>
    </div>
  );
}

/** Affiche email + téléphone avec un bouton « copier » sur chaque ligne. */
export default function CopyableContact({ email, phone }: { email?: string | null; phone?: string | null }) {
  if (!email && !phone) return null;
  return (
    <div className="bg-slate-800/40 border border-white/8 rounded-xl px-4 py-3 sm:col-span-2">
      <p className="text-xs text-slate-500 mb-2">Contact client</p>
      <div className="space-y-2">
        {phone && <CopyRow icon={Phone} value={phone} href={`tel:${phone}`} />}
        {email && <CopyRow icon={Mail} value={email} href={`mailto:${email}`} />}
      </div>
    </div>
  );
}
