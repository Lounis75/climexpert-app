"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MessageCircle, Phone, Mail, MapPin, Zap, CheckCircle2, ArrowRight, Send, Clock, Shield, ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AddressAutocomplete from "@/components/AddressAutocomplete";

const demandeOptions = [
  { value: "installation", label: "Installation" },
  { value: "entretien", label: "Entretien / Maintenance" },
  { value: "depannage", label: "Dépannage" },
  { value: "contrat-pro", label: "Contrat professionnel" },
  { value: "autre", label: "Autre demande" },
];

const bienOptions = [
  { value: "appartement", label: "Appartement" },
  { value: "maison", label: "Maison" },
  { value: "local-professionnel", label: "Local professionnel" },
  { value: "hotel-restaurant", label: "Hôtel / Restaurant" },
  { value: "copropriete", label: "Copropriété / Immeuble" },
];

const inputBase = "w-full px-4 py-3.5 rounded-xl border border-slate-200 text-slate-800 text-sm placeholder-slate-400 focus:outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all bg-white";

interface FormState {
  type: string;
  bien: string;
  ville: string;
  nom: string;
  telephone: string;
  email: string;
  message: string;
  consent: boolean;
  typeClient: string;
}

const initialForm: FormState = { type: "", bien: "", ville: "", nom: "", telephone: "", email: "", message: "", consent: false, typeClient: "particulier" };

function openChat() {
  window.dispatchEvent(new CustomEvent("open-chat"));
}

function PillGroup({ options, name, value, onChange }: {
  options: { value: string; label: string }[];
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`py-3.5 px-3 rounded-xl border text-sm font-medium transition-all text-center ${
            value === opt.value
              ? "bg-sky-50 border-sky-400 text-sky-700"
              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function ContactClient() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nom || !form.telephone || !form.type || !form.bien || !form.email || !form.ville) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setStatus("success"); setForm(initialForm); }
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  return (
    <>
      <Header />
      <nav aria-label="Fil d'ariane" className="border-b border-white/8 bg-[#080d18]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 lg:pt-24 pb-2.5">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li><Link href="/" className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 transition-colors"><Home className="w-3 h-3" />Accueil</Link></li>
            <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-slate-600" /><span className="text-xs font-medium text-white">Contact</span></li>
          </ol>
        </div>
      </nav>
      <main className="bg-[#f8fafc]">

        {/* Hero */}
        <section className="relative bg-[#080d18] overflow-hidden pt-12 pb-16">
          <div className="absolute inset-0 bg-grid opacity-40" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-sky-500/10 blur-[100px] rounded-full" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 text-sky-400 text-sm font-medium border border-sky-500/20 mb-5">
                Contactez-nous
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
                Parlons de votre projet
              </h1>
              <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
                Particulier ou professionnel, notre équipe répond sous 2h en jours ouvrés.
              </p>
              {/* Alex CTA inline */}
              <div className="inline-flex items-center gap-3 bg-white/8 border border-white/15 rounded-2xl px-5 py-3">
                <Zap className="w-4 h-4 text-sky-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">Besoin d&apos;un devis rapide ?</span>
                <button
                  onClick={openChat}
                  className="flex items-center gap-1.5 px-4 py-1.5 bg-sky-500 hover:bg-sky-400 text-white text-xs font-semibold rounded-lg transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  Parler à Alex
                </button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Form section */}
        <section className="py-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden"
            >
              {/* Form header */}
              <div className="px-8 pt-8 pb-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-1">Envoyer une demande</h2>
                <p className="text-slate-500 text-sm">Un technicien vous rappelle sous 24h.</p>
              </div>

              {status === "success" ? (
                <div className="px-8 py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-slate-900 font-bold text-xl mb-2">Demande envoyée !</h3>
                  <p className="text-slate-500 text-sm max-w-xs mx-auto">
                    Notre équipe vous contacte dans les 2h en jours ouvrés. Vous pouvez aussi appeler le{" "}
                    <a href="tel:+33667432767" className="text-sky-600 font-medium">06 67 43 27 67</a>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="px-8 py-7 space-y-6">

                  {/* Particulier / Professionnel */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">Vous êtes</label>
                    <PillGroup
                      options={[{ value: "particulier", label: "Particulier" }, { value: "professionnel", label: "Professionnel" }]}
                      name="typeClient"
                      value={form.typeClient}
                      onChange={(v) => setForm((p) => ({ ...p, typeClient: v }))}
                    />
                  </div>

                  {/* Type de demande */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                      Type de demande <span className="text-red-400">*</span>
                    </label>
                    <PillGroup
                      options={demandeOptions}
                      name="type"
                      value={form.type}
                      onChange={(v) => setForm((p) => ({ ...p, type: v }))}
                    />
                  </div>

                  {/* Type de bien */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2.5">
                      Type de bien <span className="text-red-400">*</span>
                    </label>
                    <PillGroup
                      options={bienOptions}
                      name="bien"
                      value={form.bien}
                      onChange={(v) => setForm((p) => ({ ...p, bien: v }))}
                    />
                  </div>

                  {/* Nom + Téléphone */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="nom" className="block text-sm font-semibold text-slate-700 mb-2.5">
                        Prénom / Nom <span className="text-red-400">*</span>
                      </label>
                      <input id="nom" name="nom" type="text" value={form.nom} onChange={handleChange} required placeholder="Jean Dupont" className={inputBase} />
                    </div>
                    <div>
                      <label htmlFor="telephone" className="block text-sm font-semibold text-slate-700 mb-2.5">
                        Téléphone <span className="text-red-400">*</span>
                      </label>
                      <input id="telephone" name="telephone" type="tel" value={form.telephone} onChange={handleChange} required placeholder="06 00 00 00 00" className={inputBase} />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2.5">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required placeholder="jean@exemple.fr" className={inputBase} />
                  </div>

                  {/* Ville */}
                  <div>
                    <label htmlFor="ville" className="block text-sm font-semibold text-slate-700 mb-2.5">
                      Adresse / Ville / Code postal <span className="text-red-400">*</span>
                    </label>
                    <AddressAutocomplete
                      id="ville"
                      name="ville"
                      required
                      value={form.ville}
                      onChange={(v) => setForm((p) => ({ ...p, ville: v }))}
                      placeholder="Commencez à taper votre adresse…"
                      className={inputBase}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2.5">
                      Message <span className="text-slate-400 font-normal text-xs">(optionnel)</span>
                    </label>
                    <textarea id="message" name="message" value={form.message} onChange={handleChange} rows={3} placeholder="Précisez votre demande, le nombre de pièces, la marque de votre appareil..." className={`${inputBase} resize-none`} />
                  </div>

                  {/* Consentement RGPD (démarchage) — facultatif */}
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.consent}
                      onChange={(e) => setForm((p) => ({ ...p, consent: e.target.checked }))}
                      className="mt-0.5 w-4 h-4 rounded border-slate-500 bg-transparent text-sky-500 focus:ring-sky-500/40 flex-shrink-0"
                    />
                    <span className="text-slate-400 text-xs leading-relaxed">
                      J&apos;accepte que ClimExpert me recontacte pour des offres commerciales et conseils.
                      Facultatif — vous pouvez vous désinscrire à tout moment. Vos données ne sont jamais revendues.
                    </span>
                  </label>

                  {status === "error" && (
                    <p className="text-red-500 text-sm">Une erreur est survenue. Réessayez ou appelez le 06 67 43 27 67.</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === "loading" || !form.nom || !form.telephone || !form.type || !form.bien}
                    className="w-full flex items-center justify-center gap-2 py-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 text-sm"
                  >
                    {status === "loading" ? (
                      <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Envoi en cours...</>
                    ) : (
                      <><Send className="w-4 h-4" />Envoyer ma demande<ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <p className="text-center text-slate-400 text-xs pt-1">
                    Pour une réponse immédiate, utilisez{" "}
                    <button type="button" onClick={openChat} className="text-sky-500 hover:underline font-medium">l&apos;assistant Alex</button>
                    {" "}(réponse en quelques secondes).
                  </p>
                </form>
              )}
            </motion.div>
          </div>
        </section>

        {/* Company info */}
        <section className="pb-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="grid sm:grid-cols-3 gap-4"
            >
              <a href="tel:+33667432767" className="flex flex-col gap-3 bg-white rounded-2xl border border-slate-200 p-5 hover:border-sky-200 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4.5 h-4.5 text-sky-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Téléphone</p>
                  <p className="text-slate-800 font-semibold text-sm group-hover:text-sky-600 transition-colors">06 67 43 27 67</p>
                  <p className="text-slate-400 text-xs mt-0.5">Lun–Sam, 8h–19h</p>
                </div>
              </a>

              <a href="mailto:contact@climexpert.fr" className="flex flex-col gap-3 bg-white rounded-2xl border border-slate-200 p-5 hover:border-sky-200 hover:shadow-sm transition-all group">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4.5 h-4.5 text-sky-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Email</p>
                  <p className="text-slate-800 font-semibold text-sm group-hover:text-sky-600 transition-colors truncate">contact@climexpert.fr</p>
                  <p className="text-slate-400 text-xs mt-0.5">Réponse sous 2h</p>
                </div>
              </a>

              <div className="flex flex-col gap-3 bg-white rounded-2xl border border-slate-200 p-5">
                <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4.5 h-4.5 text-sky-500" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-0.5">Zone</p>
                  <p className="text-slate-800 font-semibold text-sm">Île-de-France</p>
                  <p className="text-slate-400 text-xs mt-0.5">75, 77, 78, 91, 92, 93, 94, 95</p>
                </div>
              </div>
            </motion.div>

            {/* Engagements */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="mt-4 bg-white rounded-2xl border border-slate-200 p-5"
            >
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  { icon: Clock, text: "Réponse sous 2h en jours ouvrés" },
                  { icon: CheckCircle2, text: "Devis gratuit sans engagement" },
                  { icon: Shield, text: "Techniciens certifiés fluides cat. I" },
                  { icon: Zap, text: "Intervention en 24-48h max" },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 text-sm text-slate-600">
                    <Icon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* FAQ SEO */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-3">Questions fréquentes</span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Questions les plus courantes</h2>
            </div>
            <div className="space-y-4">
              {[
                { q: "Quel est le délai de réponse après une prise de contact ?", a: "Nous répondons à toutes les demandes sous 2h en heures ouvrées (7h-20h, 7j/7). Pour les urgences de dépannage, un technicien peut intervenir sous 48h." },
                { q: "Comment puis-je joindre ClimExpert en urgence ?", a: "Pour une urgence, appelez directement le 06 67 43 27 67 ou écrivez via WhatsApp. Notre équipe est disponible 7j/7 de 7h à 20h." },
                { q: "Intervenez-vous pour toutes les marques de climatisation ?", a: "Oui, nos techniciens sont formés sur toutes les marques : Daikin, Mitsubishi Electric, Samsung, Toshiba, LG, Fujitsu, Atlantic, Panasonic et bien d'autres." },
                { q: "Proposez-vous des contrats d'entretien pour les professionnels ?", a: "Oui, nous proposons des contrats d'entretien annuels adaptés aux locaux professionnels, hôtels, restaurants et copropriétés. Contactez-nous pour un devis sur mesure." },
              ].map(({ q, a }) => (
                <details key={q} className="group bg-slate-50 border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <summary className="flex items-center justify-between px-6 py-4 cursor-pointer list-none">
                    <span className="font-semibold text-slate-900 text-sm pr-4">{q}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="px-6 pb-5 text-slate-600 text-sm leading-relaxed">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  );
}
