"use client";

import { useState } from "react";
import {
  Phone, Mail, MapPin, Trash2, Plus, X, Check,
  UserCircle, MessageSquare, Building2, ChevronRight, AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import type { Client } from "@/lib/clients";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const inputCls = "w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-sky-500/50";

interface NewClientForm {
  typeClient: string;
  civilite: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  siret: string;
  formeJuridique: string;
  representant: string;
  representantQualite: string;
  notes: string;
}

const emptyForm: NewClientForm = {
  typeClient: "particulier", civilite: "", name: "", phone: "", email: "", address: "", city: "",
  siret: "", formeJuridique: "", representant: "", representantQualite: "", notes: "",
};

export default function ClientsManager({ initialClients, actions }: { initialClients: Client[]; actions?: Record<string, string> }) {
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

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
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
          typeClient: form.typeClient,
          civilite: form.civilite || undefined,
          name: form.name,
          phone: form.phone,
          email: form.email || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          siret: form.siret || undefined,
          formeJuridique: form.formeJuridique || undefined,
          representant: form.representant || undefined,
          representantQualite: form.representantQualite || undefined,
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

          {/* Type de client (pilote le contrat : TVA, clauses, bloc identité) */}
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Type de client *</label>
            <div className="flex gap-2">
              {[{ v: "particulier", l: "Particulier" }, { v: "professionnel", l: "Professionnel" }].map(({ v, l }) => (
                <button key={v} type="button" onClick={() => setForm((p) => ({ ...p, typeClient: v }))}
                  className={`flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    form.typeClient === v ? "border-sky-500/60 bg-sky-500/10 text-sky-300" : "border-white/10 bg-slate-700/40 text-slate-400 hover:border-white/20"
                  }`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {form.typeClient === "particulier" && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Civilité</label>
                <select name="civilite" value={form.civilite} onChange={handleChange} className={inputCls}>
                  <option value="">—</option>
                  <option value="M.">M.</option>
                  <option value="Madame">Madame</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">{form.typeClient === "professionnel" ? "Raison sociale *" : "Nom *"}</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder={form.typeClient === "professionnel" ? "Pizzeria Délice" : "Jean Dupont"} className={inputCls} />
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

            {/* Champs professionnels (pour le contrat) */}
            {form.typeClient === "professionnel" && (
              <>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">SIRET</label>
                  <input name="siret" value={form.siret} onChange={handleChange} placeholder="123 456 789 00010" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Forme juridique</label>
                  <input name="formeJuridique" value={form.formeJuridique} onChange={handleChange} placeholder="SARL au capital de 5 000 €" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Représentant</label>
                  <input name="representant" value={form.representant} onChange={handleChange} placeholder="Jean Dupont" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Qualité du représentant</label>
                  <input name="representantQualite" value={form.representantQualite} onChange={handleChange} placeholder="gérant" className={inputCls} />
                </div>
              </>
            )}

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
        {filtered.map((client) => {
          const action = actions?.[client.id];
          return (
          <div
            key={client.id}
            className={`relative bg-slate-800/40 border rounded-2xl p-4 transition-all ${
              action ? "border-red-500/40 hover:border-red-500/60" : "border-white/8 hover:border-sky-500/30"
            }`}
          >
            {/* Toute la carte est cliquable → fiche client (overlay) */}
            <Link href={`/admin/clients/${client.id}`} className="absolute inset-0 z-0" aria-label={`Voir la fiche de ${client.name}`} />
            <div className="relative z-10 flex items-start justify-between gap-3 flex-wrap pointer-events-none">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="text-white font-semibold text-sm">{client.name}</span>
                  {client.city && (
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <MapPin className="w-3 h-3" />
                      {client.city}
                    </span>
                  )}
                  {action && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-red-300 bg-red-500/10 border border-red-500/30 rounded-full px-1.5 py-0.5" title={`Action à faire : ${action}`}>
                      <AlertTriangle className="w-2.5 h-2.5 flex-shrink-0" /> {action}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                  <a href={`tel:${client.phone}`} className="flex items-center gap-1 py-1 text-sky-400 hover:text-sky-300 transition-colors pointer-events-auto relative z-10">
                    <Phone className="w-3 h-3" />
                    {client.phone}
                  </a>
                  {client.email && (
                    <a href={`mailto:${client.email}`} className="flex items-center gap-1 py-1 hover:text-slate-300 transition-colors pointer-events-auto relative z-10">
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
                <ChevronRight className="w-4 h-4 text-slate-500" />
                <button
                  onClick={() => handleDelete(client.id)}
                  disabled={deleting === client.id}
                  className="p-2 -m-1 rounded-lg text-slate-600 hover:text-red-400 hover:bg-white/5 transition-colors disabled:opacity-40 pointer-events-auto relative z-10"
                  title="Supprimer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {clients.length > 0 && (
        <p className="text-slate-600 text-xs text-center mt-8">
          {clients.length} client{clients.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
