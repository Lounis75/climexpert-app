"use client";

import { useState } from "react";
import {
  Phone, Mail, MapPin, Trash2, Plus, X, Check,
  UserCircle, MessageSquare, Building2,
} from "lucide-react";
import type { Client } from "@/lib/clients";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50";

interface NewClientForm {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  notes: string;
}

const emptyForm: NewClientForm = { name: "", phone: "", email: "", address: "", city: "", notes: "" };

export default function ClientsManager({ initialClients }: { initialClients: Client[] }) {
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewClientForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.city ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          notes: form.notes || undefined,
        }),
      });
      if (res.ok) {
        const { client } = await res.json();
        setClients((p) => [client, ...p]);
        setForm(emptyForm);
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Supprimer ce client définitivement ?")) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/clients?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      if (res.ok) setClients((p) => p.filter((c) => c.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex-1 max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher nom, téléphone, ville..."
            className="w-full px-3 py-2 rounded-xl border border-white/10 bg-slate-800/60 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50"
          />
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-xl transition-colors"
        >
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Annuler" : "Nouveau client"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-slate-800/60 border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
          <h3 className="text-white text-sm font-semibold">Nouveau client</h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Nom *</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder="Jean Dupont" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Téléphone *</label>
              <input name="phone" value={form.phone} onChange={handleChange} required placeholder="06 00 00 00 00" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Email</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="jean@exemple.fr" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Ville</label>
              <input name="city" value={form.city} onChange={handleChange} placeholder="Paris" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1.5">Adresse</label>
              <input name="address" value={form.address} onChange={handleChange} placeholder="12 rue de la Paix, 75001 Paris" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1.5">Notes internes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={2} placeholder="Informations utiles..." className={`${inputCls} resize-none`} />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving || !form.name || !form.phone}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              {saving ? "Enregistrement..." : "Créer le client"}
            </button>
          </div>
        </form>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-800/40 border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{clients.length}</p>
          <p className="text-slate-400 text-xs mt-0.5">Clients total</p>
        </div>
        <div className="bg-slate-800/40 border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{clients.filter((c) => c.email).length}</p>
          <p className="text-slate-400 text-xs mt-0.5">Avec email</p>
        </div>
        <div className="bg-slate-800/40 border border-white/8 rounded-xl p-4">
          <p className="text-2xl font-bold text-white">{new Set(clients.map((c) => c.city).filter(Boolean)).size}</p>
          <p className="text-slate-400 text-xs mt-0.5">Villes</p>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <UserCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {clients.length === 0 ? "Aucun client pour l'instant." : "Aucun client pour cette recherche."}
          </p>
        </div>
      )}

      {/* Clients list */}
      <div className="space-y-3">
        {filtered.map((client) => (
          <div
            key={client.id}
            className="bg-slate-800/40 border border-white/8 rounded-2xl p-4 hover:border-white/15 transition-all"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-white font-semibold text-sm">{client.name}</span>
                  {client.city && (
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <MapPin className="w-3 h-3" />
                      {client.city}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  <a href={`tel:${client.phone}`} className="flex items-center gap-1 text-sky-400 hover:text-sky-300 transition-colors">
                    <Phone className="w-3 h-3" />
                    {client.phone}
                  </a>
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="flex items-center gap-1 hover:text-slate-300 transition-colors">
                      <Mail className="w-3 h-3" />
                      {client.email}
                    </a>
                  )}
                  {client.address && (
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3" />
                      {client.address}
                    </span>
                  )}
                </div>
                {client.notes && (
                  <div className="mt-2 flex items-start gap-1.5 text-slate-500 text-xs">
                    <MessageSquare className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{client.notes}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-slate-600 text-xs">{formatDate(client.createdAt)}</span>
                <button
                  onClick={() => handleDelete(client.id)}
                  disabled={deleting === client.id}
                  className="text-slate-600 hover:text-red-400 transition-colors disabled:opacity-40"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {clients.length > 0 && (
        <p className="text-slate-600 text-xs text-center mt-8">
          {clients.length} client{clients.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
