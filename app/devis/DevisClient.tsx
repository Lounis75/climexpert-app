"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Phone, Mail, CheckCircle2, ArrowRight, MapPin } from "lucide-react";

const serviceOptions = [
  "Installation climatisation",
  "Entretien / maintenance",
  "Dépannage",
  "Autre",
];

const propertyOptions = [
  "Appartement",
  "Maison individuelle",
  "Local professionnel",
  "Copropriété",
];

export default function DevisClient() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch("https://formspree.io/f/YOUR_FORM_ID", {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        setSubmitted(true);
        return;
      }
    } catch {
      // ignore, fallback below
    }

    // Fallback mailto
    const name = data.get("name");
    const email = data.get("email");
    const phone = data.get("phone");
    const service = data.get("service");
    const message = data.get("message");
    window.location.href = `mailto:contact@climexpert.fr?subject=Demande de devis — ${service}&body=Nom: ${name}%0ATéléphone: ${phone}%0AEmail: ${email}%0AMessage: ${message}`;
    setLoading(false);
  }

  return (
    <>
      <Header />
      <main>
        {/* Hero */}
        <section className="bg-[#0B1120] pt-28 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-6">
              Réponse sous 24h
            </span>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight leading-[1.1]">
              Demande de devis{" "}
              <span className="text-gradient">gratuit</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-xl mx-auto">
              Décrivez votre projet, nous vous rappelons sous 24h avec une estimation précise et sans engagement.
            </p>
          </div>
        </section>

        {/* Form + Contact */}
        <section id="devis" className="py-20 bg-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-12">

              {/* Form */}
              <div className="lg:col-span-2">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Demande envoyée !</h2>
                    <p className="text-slate-500 max-w-sm">
                      Nous avons bien reçu votre demande. Un technicien vous contactera dans les 24h pour vous proposer une estimation.
                    </p>
                    <a
                      href="/"
                      className="mt-8 inline-flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition-colors text-sm"
                    >
                      Retour à l&apos;accueil
                    </a>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Prénom et nom <span className="text-sky-500">*</span>
                        </label>
                        <input
                          name="name"
                          required
                          type="text"
                          placeholder="Jean Dupont"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Téléphone <span className="text-sky-500">*</span>
                        </label>
                        <input
                          name="phone"
                          required
                          type="tel"
                          placeholder="06 XX XX XX XX"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Adresse email
                      </label>
                      <input
                        name="email"
                        type="email"
                        placeholder="jean@exemple.fr"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Type de prestation <span className="text-sky-500">*</span>
                        </label>
                        <select
                          name="service"
                          required
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition bg-white"
                        >
                          <option value="">Sélectionner...</option>
                          {serviceOptions.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Type de bien
                        </label>
                        <select
                          name="property"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition bg-white"
                        >
                          <option value="">Sélectionner...</option>
                          {propertyOptions.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Ville / Code postal
                      </label>
                      <input
                        name="location"
                        type="text"
                        placeholder="Paris 15e / 75015"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Décrivez votre projet
                      </label>
                      <textarea
                        name="message"
                        rows={5}
                        placeholder="Ex : Installation d'un monosplit dans un salon de 30m², appartement au 3e étage, Paris 15e. Façade disponible côté cour."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/25"
                    >
                      {loading ? "Envoi en cours…" : "Envoyer ma demande"}
                      {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>

                    <p className="text-slate-400 text-xs text-center">
                      Devis 100% gratuit et sans engagement · Réponse sous 24h
                    </p>
                  </form>
                )}
              </div>

              {/* Sidebar contact */}
              <div className="space-y-5">
                <div className="bg-[#0B1120] rounded-2xl p-6 text-center">
                  <p className="text-slate-400 text-sm mb-3">Vous préférez appeler ?</p>
                  <a
                    href="tel:+33667432767"
                    className="inline-flex items-center gap-3 text-white font-bold text-xl hover:text-sky-400 transition-colors"
                  >
                    <Phone className="w-5 h-5 text-sky-400" />
                    06 67 43 27 67
                  </a>
                  <p className="text-slate-500 text-xs mt-2">Disponible 7j/7</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <a
                    href="mailto:contact@climexpert.fr"
                    className="flex items-center gap-3 text-slate-700 hover:text-sky-600 transition-colors text-sm font-medium"
                  >
                    <Mail className="w-4 h-4 text-sky-500 flex-shrink-0" />
                    contact@climexpert.fr
                  </a>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                  <div className="flex items-start gap-3 text-slate-600 text-sm">
                    <MapPin className="w-4 h-4 text-sky-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-800 mb-1">Zone d&apos;intervention</p>
                      <p>Île-de-France</p>
                      <p className="text-slate-400 text-xs mt-1">75 · 92 · 93 · 94 · 77 · 78 · 91 · 95</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl p-6 border border-sky-100 bg-sky-50 space-y-3">
                  <p className="text-sky-700 font-semibold text-sm">Ce qui est inclus</p>
                  {[
                    "Étude de faisabilité offerte",
                    "Devis détaillé et transparent",
                    "Conseils sur les aides disponibles",
                    "Aucun engagement avant validation",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="w-4 h-4 text-sky-500 flex-shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
