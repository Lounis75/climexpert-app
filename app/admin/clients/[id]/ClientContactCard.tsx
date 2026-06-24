"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, Mail, MapPin, Copy, Check, ExternalLink, Pencil } from "lucide-react";

interface Props {
  clientId: string;
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

export default function ClientContactCard({ clientId, phone, email, address, city, name }: Props) {
  const router = useRouter();
  const [allCopied, setAllCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [vals, setVals] = useState({ phone, email: email ?? "", address: address ?? "", city: city ?? "" });

  const fullAddress = [vals.address, vals.city].filter(Boolean).join(", ");
  const set = (k: keyof typeof vals, v: string) => setVals((p) => ({ ...p, [k]: v }));

  async function copyAll() {
    const lines = [name, vals.phone, vals.email || null, fullAddress || null].filter(Boolean).join("\n");
    await navigator.clipboard.writeText(lines);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 1800);
  }

  function cancel() {
    setVals({ phone, email: email ?? "", address: address ?? "", city: city ?? "" });
    setEditing(false); setError("");
  }

  async function save() {
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/clients", {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: clientId,
          phone: vals.phone.trim(),
          email: vals.email.trim() || null,
          address: vals.address.trim() || null,
          city: vals.city.trim() || null,
        }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? "Erreur lors de l'enregistrement"); return; }
      setEditing(false);
      router.refresh();
    } catch { setError("Erreur réseau"); }
    finally { setSaving(false); }
  }

  const inputCls = "w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50";

  return (
    <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/8">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Coordonnées</p>
        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={cancel} className="px-2.5 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs transition-all">Annuler</button>
              <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-xs font-semibold transition-colors">
                {saving ? "…" : <><Check className="w-3 h-3" /> Enregistrer</>}
              </button>
            </>
          ) : (
            <>
              <button onClick={copyAll} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs transition-all">
                {allCopied ? <><Check className="w-3 h-3 text-emerald-400" /> Copié !</> : <><Copy className="w-3 h-3" /> Tout copier</>}
              </button>
              <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs transition-all">
                <Pencil className="w-3 h-3" /> Modifier
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        /* ── Mode édition ── */
        <div className="p-5 space-y-3">
          {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Téléphone</label>
            <input value={vals.phone} onChange={(e) => set("phone", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Email</label>
            <input type="email" value={vals.email} onChange={(e) => set("email", e.target.value)} placeholder="email@exemple.fr" className={inputCls} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Adresse</label>
              <input value={vals.address} onChange={(e) => set("address", e.target.value)} placeholder="9 rue…" className={inputCls} />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase tracking-wide mb-1">Ville / CP</label>
              <input value={vals.city} onChange={(e) => set("city", e.target.value)} placeholder="75015 Paris" className={inputCls} />
            </div>
          </div>
        </div>
      ) : (
        /* ── Mode lecture ── */
        <div className="divide-y divide-white/5">
          {/* Phone */}
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center flex-shrink-0">
              <Phone className="w-3.5 h-3.5 text-sky-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Téléphone</p>
              <a href={`tel:${vals.phone}`} className="text-white text-sm font-medium hover:text-sky-300 transition-colors flex items-center gap-1.5 group">
                {vals.phone}
                <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-sky-400 transition-colors" />
              </a>
            </div>
            <CopyButton text={vals.phone} />
          </div>

          {/* Email */}
          {vals.email && (
            <div className="flex items-center gap-3 px-5 py-3">
              <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                <Mail className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-slate-500 uppercase tracking-wide mb-0.5">Email</p>
                <a href={`mailto:${vals.email}`} className="text-white text-sm font-medium hover:text-violet-300 transition-colors truncate block">
                  {vals.email}
                </a>
              </div>
              <CopyButton text={vals.email} />
            </div>
          )}

          {/* Address */}
          {fullAddress && (
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
      )}
    </div>
  );
}
