"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Client, Technicien } from "@/lib/db/schema";

const TYPES = [
  { value: "installation",  label: "Installation" },
  { value: "entretien",     label: "Entretien" },
  { value: "depannage",     label: "Dépannage" },
  { value: "contrat-pro",   label: "Contrat pro" },
  { value: "autre",         label: "Autre" },
];

export default function InterventionForm({
  clients,
  techniciens,
}: {
  clients: Client[];
  techniciens: Technicien[];
}) {
  const router = useRouter();
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [type, setType] = useState("installation");
  const [scheduledAt, setScheduledAt] = useState("");
  const [technicienId, setTechnicienId] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pré-remplir l'adresse depuis le client sélectionné
  function handleClientChange(id: string) {
    setClientId(id);
    const c = clients.find((c) => c.id === id);
    if (c?.address) setAddress(c.address);
    else setAddress("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!scheduledAt) { setError("Date et heure requises"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/interventions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          type,
          scheduledAt,
          technicienId: technicienId || undefined,
          address: address || undefined,
          notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "Erreur");
        return;
      }
      const { intervention } = await res.json();
      router.push(`/admin/interventions/${intervention.id}`);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/interventions" className="text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-2xl font-bold text-white">Nouvelle intervention</h1>
      </div>

      <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-6 grid sm:grid-cols-2 gap-4">

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Client *</label>
          <select
            value={clientId}
            onChange={(e) => handleClientChange(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
          >
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}{c.city ? ` — ${c.city}` : ""}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Type *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Date et heure *</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            required
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Technicien</label>
          <select
            value={technicienId}
            onChange={(e) => setTechnicienId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm focus:outline-none focus:border-sky-500 transition-all"
          >
            <option value="">— Non assigné</option>
            {techniciens.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Adresse d&apos;intervention</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="15 rue de la Paix, Paris 75001"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs text-slate-400 mb-1.5 font-medium">Notes internes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Accès code porte, équipement à apporter…"
            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all resize-none"
          />
        </div>
      </div>

      {error && (
        <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href="/admin/interventions"
          className="px-5 py-2.5 text-slate-400 hover:text-white border border-white/10 rounded-xl text-sm transition-colors"
        >
          Annuler
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white font-semibold text-sm rounded-xl transition-all"
        >
          {loading ? "Création…" : "Planifier l'intervention"}
        </button>
      </div>
    </form>
  );
}
