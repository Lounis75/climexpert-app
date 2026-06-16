"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, Copy, Check, ExternalLink } from "lucide-react";

interface Props {
  phone: string;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  name: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <button
      onClick={copy}
      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/8 transition-all"
      title="Copier"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

export default function ClientContactCard({ phone, email, address, city, name }: Props) {
  const [allCopied, setAllCopied] = useState(false);

  const fullAddress = [address, city].filter(Boolean).join(", ");

  async function copyAll() {
    const lines = [
      name,
      phone,
      email ?? null,
      fullAddress || null,
    ].filter(Boolean).join("\n");
    await navigator.clipboard.writeText(lines);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 1800);
  }

  return (
    <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Coordonnées</p>
        <button
          onClick={copyAll}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs transition-all"
        >
          {allCopied ? (
            <><Check className="w-3 h-3 text-emerald-400" /> Copié !</>
          ) : (
            <><Copy className="w-3 h-3" /> Tout copier</>
          )}
        </button>
      </div>

      {/* Fields */}
      <div className="divide-y divide-white/5">
        {/* Phone */}
        <div className="flex items-center gap-3 px-5 py-3">
          <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
            <Phone className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Téléphone</p>
            <a href={`tel:${phone}`} className="text-white text-sm font-medium hover:text-sky-300 transition-colors flex items-center gap-1.5 group">
              {phone}
              <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-sky-400 transition-colors" />
            </a>
          </div>
          <CopyButton text={phone} />
        </div>

        {/* Email */}
        {email && (
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Mail className="w-3.5 h-3.5 text-violet-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Email</p>
              <a href={`mailto:${email}`} className="text-white text-sm font-medium hover:text-violet-300 transition-colors truncate block group flex items-center gap-1.5">
                {email}
              </a>
            </div>
            <CopyButton text={email} />
          </div>
        )}

        {/* Address */}
        {(address || city) && (
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Adresse</p>
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white text-sm font-medium hover:text-emerald-300 transition-colors flex items-center gap-1.5 group"
              >
                <span className="truncate">{fullAddress}</span>
                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
              </a>
            </div>
            <CopyButton text={fullAddress} />
          </div>
        )}
      </div>
    </div>
  );
}
