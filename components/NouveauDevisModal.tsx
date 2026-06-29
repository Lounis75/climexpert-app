"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, X, CheckCircle2, Search, Calculator } from "lucide-react";

const PROJECTS: [string, string][] = [
  ["installation", "Installation"], ["entretien", "Entretien"], ["depannage", "Dépannage"], ["contrat-pro", "Contrat pro"], ["autre", "Autre"],
];

type ClientHit = { id: string; name: string; email?: string | null };

// « Nouveau devis » : pour un client existant (recherche) OU un nouveau contact. Upload du PDF
// -> envoi au client (lien de décision) -> à l'acceptation, une intervention à planifier est créée.
export default function NouveauDevisModal({ presetClient, triggerClassName, triggerLabel = "Nouveau devis" }: {
  presetClient?: { id: string; name: string };
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"client" | "contact">("client");
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<ClientHit[]>([]);
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(presetClient ?? null);
  const [searching, setSearching] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "", email: "", address: "" });
  const [project, setProject] = useState("");
  const [montant, setMontant] = useState("");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const inp = "w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500/50";

  async function searchClients(q: string) {
    setClientQuery(q);
    if (q.trim().length < 2) { setClientResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/admin/clients?q=${encodeURIComponent(q)}&page=1&limit=8`);
      const d = await res.json().catch(() => ({}));
      const list: ClientHit[] = d.items ?? d.clients ?? [];
      setClientResults(list.map((c) => ({ id: c.id, name: c.name, email: c.email })));
    } finally { setSearching(false); }
  }

  function reset() {
    setMode("client"); setSelectedClient(presetClient ?? null); setClientQuery(""); setClientResults([]);
    setContact({ name: "", phone: "", email: "", address: "" }); setProject(""); setMontant(""); setMessage("");
    setFile(null); setError(""); setDone(false);
  }

  // Bascule vers l'outil de chiffrage terrain, en pré-remplissant ce qu'on connaît déjà.
  // Client existant -> ?client=<id> (rattaché, pas de doublon) ; nouveau contact -> champs en query.
  function goToChiffrage() {
    const p = new URLSearchParams();
    if (project) p.set("prestation", project);
    const cli = presetClient ?? selectedClient;
    if (mode === "client" && cli) {
      p.set("client", cli.id);
    } else if (mode === "contact") {
      if (contact.name.trim()) p.set("nom", contact.name.trim());
      if (contact.phone.trim()) p.set("tel", contact.phone.trim());
      if (contact.email.trim()) p.set("email", contact.email.trim());
      if (contact.address.trim()) p.set("adr", contact.address.trim());
    }
    const qs = p.toString();
    router.push(`/admin/terrain/chiffrage${qs ? `?${qs}` : ""}`);
  }

  async function send() {
    if (!file) { setError("Ajoute le PDF du devis."); return; }
    if (mode === "client" && !selectedClient) { setError("Choisis un client."); return; }
    if (mode === "contact" && (!contact.name.trim() || !contact.phone.trim() || !contact.email.trim())) { setError("Nom, téléphone et e-mail requis."); return; }
    setSending(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (montant.trim()) fd.append("montant", montant.trim());
      if (message.trim()) fd.append("message", message.trim());
      if (project) fd.append("project", project);
      if (mode === "client" && selectedClient) fd.append("clientId", selectedClient.id);
      if (mode === "contact") {
        fd.append("name", contact.name.trim()); fd.append("phone", contact.phone.trim()); fd.append("email", contact.email.trim());
        if (contact.address.trim()) fd.append("address", contact.address.trim());
      }
      const res = await fetch("/api/admin/devis-direct", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? "Échec de l'envoi."); return; }
      setDone(true);
      router.refresh();
    } catch { setError("Erreur réseau, réessayez."); }
    finally { setSending(false); }
  }

  return (
    <>
      <button onClick={() => { reset(); setOpen(true); }} className={triggerClassName ?? "flex items-center gap-1.5 px-3 py-1.5 bg-violet-500 hover:bg-violet-400 text-white text-xs font-semibold rounded-xl transition-colors"}>
        <FileText className="w-3.5 h-3.5" /> {triggerLabel}
      </button>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="relative bg-[#0f1623] border border-white/10 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 sticky top-0 bg-[#0f1623] z-10">
              <h2 className="text-white font-semibold text-sm flex items-center gap-2"><FileText className="w-4 h-4 text-violet-400" /> Nouveau devis</h2>
              <button onClick={() => setOpen(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-500 hover:text-white hover:bg-white/8 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              {done ? (
                <div className="text-center py-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="w-7 h-7 text-emerald-400" /></div>
                  <p className="text-white font-semibold">Devis envoyé</p>
                  <p className="text-slate-400 text-sm mt-1">Le client va le recevoir. À l&apos;acceptation, une intervention à planifier sera créée automatiquement.</p>
                  <button onClick={() => setOpen(false)} className="mt-4 px-4 py-2 bg-violet-500 hover:bg-violet-400 text-white text-sm font-semibold rounded-xl">Fermer</button>
                </div>
              ) : (
                <>
                  {!presetClient && (
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setMode("client")} className={`flex-1 py-2 rounded-lg border text-xs font-semibold ${mode === "client" ? "bg-violet-500/15 border-violet-500/40 text-violet-200" : "bg-slate-900/40 border-white/10 text-slate-400"}`}>Client existant</button>
                      <button type="button" onClick={() => setMode("contact")} className={`flex-1 py-2 rounded-lg border text-xs font-semibold ${mode === "contact" ? "bg-violet-500/15 border-violet-500/40 text-violet-200" : "bg-slate-900/40 border-white/10 text-slate-400"}`}>Nouveau contact</button>
                    </div>
                  )}

                  {mode === "client" ? (
                    presetClient ? (
                      <p className="text-sm text-slate-300">Devis pour <span className="text-white font-medium">{presetClient.name}</span></p>
                    ) : selectedClient ? (
                      <div className="flex items-center justify-between rounded-lg bg-slate-900/60 border border-white/10 px-3 py-2">
                        <span className="text-white text-sm">{selectedClient.name}</span>
                        <button onClick={() => setSelectedClient(null)} className="text-slate-400 hover:text-white text-xs">Changer</button>
                      </div>
                    ) : (
                      <div>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input value={clientQuery} onChange={(e) => searchClients(e.target.value)} placeholder="Rechercher un client (nom, ville…)" className={`${inp} pl-8`} />
                        </div>
                        {clientResults.length > 0 && (
                          <div className="mt-1 rounded-lg border border-white/10 bg-slate-900/80 divide-y divide-white/5 max-h-40 overflow-y-auto">
                            {clientResults.map((c) => (
                              <button key={c.id} onClick={() => { setSelectedClient({ id: c.id, name: c.name }); setClientResults([]); }} className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-white/5">{c.name}</button>
                            ))}
                          </div>
                        )}
                        {searching && <p className="text-slate-500 text-xs mt-1">Recherche…</p>}
                      </div>
                    )
                  ) : (
                    <div className="space-y-2">
                      <input value={contact.name} onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))} placeholder="Nom *" className={inp} />
                      <div className="grid grid-cols-2 gap-2">
                        <input value={contact.phone} onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))} placeholder="Téléphone *" className={inp} />
                        <input value={contact.email} onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))} placeholder="Email *" className={inp} />
                      </div>
                      <input value={contact.address} onChange={(e) => setContact((p) => ({ ...p, address: e.target.value }))} placeholder="Adresse (facultatif)" className={inp} />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <select value={project} onChange={(e) => setProject(e.target.value)} className={inp}>
                      <option value="">Prestation…</option>
                      {PROJECTS.map(([v, l]) => <option key={v} value={v} className="bg-slate-800">{l}</option>)}
                    </select>
                    <input type="number" min="0" value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="Montant TTC (€)" className={inp} />
                  </div>

                  <button type="button" onClick={goToChiffrage} disabled={mode === "client" && !(presetClient || selectedClient)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-violet-500/40 text-violet-200 hover:bg-violet-500/10 disabled:opacity-40 text-sm font-semibold transition-colors">
                    <Calculator className="w-4 h-4" /> Chiffrer avec l&apos;outil terrain
                  </button>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px]"><span className="flex-1 h-px bg-white/10" />ou joindre un PDF déjà prêt<span className="flex-1 h-px bg-white/10" /></div>

                  <label
                    onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                    onDragLeave={() => setDrag(false)}
                    onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f && f.type === "application/pdf") { setFile(f); setError(""); } else setError("Le fichier doit être un PDF."); }}
                    className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 cursor-pointer transition-colors ${drag ? "border-violet-500 bg-violet-500/10" : file ? "border-emerald-500/40 bg-emerald-500/5" : "border-white/15 hover:border-white/30 bg-slate-900/40"}`}
                  >
                    <input type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setError(""); } }} />
                    {file ? <><CheckCircle2 className="w-6 h-6 text-emerald-400" /><span className="text-white text-sm text-center break-all px-2">{file.name}</span></> : <><FileText className="w-6 h-6 text-slate-500" /><span className="text-slate-300 text-sm">Glisser le PDF du devis, ou cliquer</span></>}
                  </label>

                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Mot d'accompagnement (facultatif)…" className={`${inp} resize-none`} />

                  {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

                  <button onClick={send} disabled={sending || !file} className="w-full py-2.5 rounded-lg bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-white text-sm font-semibold transition-colors">
                    {sending ? "Envoi en cours…" : "Envoyer le devis au client"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
