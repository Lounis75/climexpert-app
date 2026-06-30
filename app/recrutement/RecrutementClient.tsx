"use client";

import { useState } from "react";
import { Briefcase, MapPin, X, CheckCircle2, Paperclip, Send } from "lucide-react";

type Offre = { id: string; titre: string; contrat: string; lieu: string | null; description: string; profil: string | null };

const inp = "w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100";

export default function RecrutementClient({ offres }: { offres: Offre[] }) {
  const [applyFor, setApplyFor] = useState<string | null>(null);
  const [form, setForm] = useState({ nom: "", email: "", telephone: "", message: "" });
  const [cv, setCv] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function open(poste: string) {
    setApplyFor(poste); setForm({ nom: "", email: "", telephone: "", message: "" }); setCv(null); setDone(false); setError("");
  }

  async function submit() {
    if (!form.nom.trim() || !form.email.trim() || !form.telephone.trim()) { setError("Nom, e-mail et téléphone sont requis."); return; }
    setSending(true); setError("");
    try {
      const fd = new FormData();
      fd.append("poste", applyFor ?? "Candidature spontanée");
      fd.append("nom", form.nom.trim()); fd.append("email", form.email.trim()); fd.append("telephone", form.telephone.trim());
      if (form.message.trim()) fd.append("message", form.message.trim());
      if (cv) fd.append("cv", cv);
      const res = await fetch("/api/recrutement", { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? "Échec de l'envoi, réessayez."); return; }
      setDone(true);
    } catch { setError("Erreur réseau, réessayez."); }
    finally { setSending(false); }
  }

  return (
    <section className="bg-slate-50 py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Nos postes ouverts</h2>
        <p className="text-slate-500 mb-8">Une candidature spontanée ? Elle est aussi la bienvenue.</p>

        {offres.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
            <Briefcase className="w-8 h-8 text-sky-500 mx-auto mb-3" />
            <p className="text-slate-700 font-semibold">Pas d&apos;annonce en ligne pour le moment.</p>
            <p className="text-slate-500 text-sm mt-1 mb-5">Mais on est toujours à l&apos;écoute des bons profils.</p>
            <button onClick={() => open("Candidature spontanée")} className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors">Candidature spontanée</button>
          </div>
        ) : (
          <div className="space-y-4">
            {offres.map((o) => (
              <div key={o.id} className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-slate-900">{o.titre}</h3>
                    <div className="flex items-center gap-3 mt-1.5 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-1 font-semibold text-sky-600 bg-sky-50 border border-sky-100 rounded-full px-2.5 py-0.5">{o.contrat}</span>
                      {o.lieu && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {o.lieu}</span>}
                    </div>
                  </div>
                  <button onClick={() => open(o.titre)} className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold transition-colors flex-shrink-0">Postuler</button>
                </div>
                <p className="text-slate-600 text-sm mt-4 whitespace-pre-wrap leading-relaxed">{o.description}</p>
                {o.profil && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide mb-1">Profil recherché</p>
                    <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed">{o.profil}</p>
                  </div>
                )}
              </div>
            ))}
            <div className="text-center pt-2">
              <button onClick={() => open("Candidature spontanée")} className="text-sky-600 hover:text-sky-700 text-sm font-semibold">Aucun ne correspond ? Envoyer une candidature spontanée</button>
            </div>
          </div>
        )}
      </div>

      {/* Modale de candidature */}
      {applyFor && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setApplyFor(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white">
              <h3 className="text-slate-900 font-semibold text-sm">Postuler · {applyFor}</h3>
              <button onClick={() => setApplyFor(null)} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5">
              {done ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="w-8 h-8 text-emerald-600" /></div>
                  <p className="text-slate-900 font-semibold">Candidature envoyée !</p>
                  <p className="text-slate-500 text-sm mt-1">Merci {form.nom.split(" ")[0]}, notre équipe revient vers vous rapidement.</p>
                  <button onClick={() => setApplyFor(null)} className="mt-5 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold">Fermer</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder="Prénom et nom *" className={inp} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })} placeholder="Téléphone *" className={inp} />
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="E-mail *" className={inp} />
                  </div>
                  <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={3} placeholder="Votre message (facultatif)…" className={`${inp} resize-none`} />
                  <label className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-dashed border-slate-300 cursor-pointer hover:border-sky-400 transition-colors text-sm">
                    <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className={cv ? "text-slate-800 truncate" : "text-slate-500"}>{cv ? cv.name : "Joindre mon CV (PDF, JPG) — facultatif"}</span>
                    <input type="file" accept="application/pdf,image/jpeg,image/png" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setCv(f); }} />
                  </label>
                  {error && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
                  <button onClick={submit} disabled={sending} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                    <Send className="w-4 h-4" /> {sending ? "Envoi…" : "Envoyer ma candidature"}
                  </button>
                  <p className="text-slate-400 text-[11px] text-center">Vos données ne servent qu&apos;au recrutement ClimExpert, jamais transmises à des tiers.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
