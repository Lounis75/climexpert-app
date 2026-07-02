"use client";

import { useState, useRef, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Phone, Mail, CheckCircle2, ArrowRight, MapPin, Camera, X, Loader2, ChevronRight, Home, MessageCircle } from "lucide-react";
import Link from "next/link";
import AddressAutocomplete from "@/components/AddressAutocomplete";

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

type PhotoFile = { file: File; preview: string; url?: string; uploading?: boolean; error?: string };

export default function DevisClient() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [photoWarning, setPhotoWarning] = useState("");
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [ville, setVille] = useState("");
  const [message, setMessage] = useState("");

  // Alex (mode contact) renvoie le récapitulatif du besoin -> on remplit la description.
  useEffect(() => {
    const handler = (e: Event) => {
      const text = (e as CustomEvent<{ text?: string }>).detail?.text;
      if (text) {
        setMessage(text);
        document.getElementById("devis-message")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    };
    window.addEventListener("alex-besoin", handler);
    return () => window.removeEventListener("alex-besoin", handler);
  }, []);

  function addPhotos(files: FileList | null) {
    if (!files) return;
    const newPhotos: PhotoFile[] = Array.from(files).slice(0, 5 - photos.length).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: false,
    }));
    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function uploadPhoto(index: number): Promise<string | null> {
    const photo = photos[index];
    if (photo.url) return photo.url;
    setPhotos((prev) => prev.map((p, i) => i === index ? { ...p, uploading: true } : p));
    try {
      const fd = new FormData();
      fd.append("file", photo.file);
      const res = await fetch("/api/upload/devis", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      setPhotos((prev) => prev.map((p, i) => i === index ? { ...p, url, uploading: false } : p));
      return url as string;
    } catch {
      setPhotos((prev) => prev.map((p, i) => i === index ? { ...p, uploading: false, error: "Erreur upload" } : p));
      return null;
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = new FormData(form);

    const serviceMap: Record<string, string> = {
      "Installation climatisation": "installation",
      "Entretien / maintenance": "entretien",
      "Dépannage": "depannage",
      "Autre": "autre",
    };
    const bienMap: Record<string, string> = {
      "Appartement": "appartement",
      "Maison individuelle": "maison",
      "Local professionnel": "local-professionnel",
      "Copropriété": "copropriete",
    };

    setSubmitError("");
    setPhotoWarning("");

    // Upload photos first. Si certaines échouent, on prévient (la demande part quand même :
    // mieux vaut un prospect sans photos qu'un prospect perdu).
    const photoUrls: string[] = [];
    let photosEnEchec = 0;
    for (let i = 0; i < photos.length; i++) {
      const url = await uploadPhoto(i);
      if (url) photoUrls.push(url);
      else photosEnEchec++;
    }
    if (photosEnEchec > 0) {
      setPhotoWarning(`${photosEnEchec} photo${photosEnEchec > 1 ? "s n'ont" : " n'a"} pas pu être jointe${photosEnEchec > 1 ? "s" : ""} (réseau). Votre demande part sans ${photosEnEchec > 1 ? "elles" : "elle"}, vous pourrez les envoyer plus tard.`);
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: data.get("name") ?? "",
          telephone: data.get("phone") ?? "",
          email: data.get("email") ?? "",
          type: serviceMap[String(data.get("service") ?? "")] ?? "autre",
          bien: bienMap[String(data.get("property") ?? "")] ?? "appartement",
          ville: data.get("location") ?? "",
          message: data.get("message") ?? "",
          photosUrls: photoUrls,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        return;
      }
      const d = await res.json().catch(() => ({}));
      setSubmitError(d.error ?? "L'envoi a échoué, réessayez dans un instant ou appelez-nous.");
    } catch {
      setSubmitError("Erreur réseau : votre demande n'est PAS partie. Vérifiez votre connexion et réessayez, ou appelez-nous.");
    }
    setLoading(false);
  }

  return (
    <>
      <Header />
      <nav aria-label="Fil d'ariane" className="border-b border-white/8 bg-[#0B1120]/60 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          <ol className="flex items-center gap-1.5 flex-wrap">
            <li><Link href="/" className="flex items-center gap-1 text-xs text-slate-400 hover:text-sky-400 transition-colors"><Home className="w-3 h-3" />Accueil</Link></li>
            <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3 text-slate-600" /><span className="text-xs font-medium text-white">Devis gratuit</span></li>
          </ol>
        </div>
      </nav>
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
                  <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
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
                        Adresse email <span className="text-sky-500">*</span>
                      </label>
                      <input
                        name="email"
                        type="email"
                        required
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
                        Adresse / Ville / Code postal <span className="text-sky-500">*</span>
                      </label>
                      <AddressAutocomplete
                        id="devis-location"
                        name="location"
                        required
                        value={ville}
                        onChange={setVille}
                        placeholder="Commencez à taper votre adresse…"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                      />
                    </div>

                    <div>
                      <label htmlFor="devis-message" className="block text-sm font-medium text-slate-700 mb-2">
                        Décrivez votre projet
                      </label>
                      <textarea
                        id="devis-message"
                        name="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        placeholder="Ex : Installation d'un monosplit dans un salon de 30m², appartement au 3e étage, Paris 15e. Façade disponible côté cour."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const fd = formRef.current ? new FormData(formRef.current) : null;
                          const ctx: Record<string, string> = {};
                          const nom = (fd?.get("name") as string) || "";
                          if (nom) ctx.nom = nom.split(" ")[0];
                          const service = (fd?.get("service") as string) || "";
                          if (service) ctx.service = service;
                          const property = (fd?.get("property") as string) || "";
                          if (property) ctx.property = property;
                          if (ville) ctx.ville = ville;
                          window.dispatchEvent(new CustomEvent("open-chat", { detail: { besoin: ctx } }));
                        }}
                        className="mt-2.5 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-sky-50 border border-sky-100 text-sky-700 text-sm font-medium hover:bg-sky-100 transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-sky-500" />
                        Pas sûr de quoi écrire ? Décrire mon besoin avec Alex
                      </button>
                    </div>

                    {/* Photo upload */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Photos de votre installation <span className="text-slate-400 font-normal">(optionnel · max 5)</span>
                      </label>
                      <p className="text-xs text-slate-400 mb-3">
                        Joignez des photos de votre climatisation existante, de votre façade ou de votre emplacement prévu. Cela nous permet de vous faire un devis plus précis.
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                        multiple
                        className="hidden"
                        onChange={(e) => addPhotos(e.target.files)}
                      />
                      {photos.length > 0 && (
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                          {photos.map((p, i) => (
                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                              <img src={p.preview} alt="" className="w-full h-full object-cover" />
                              {p.uploading && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                                </div>
                              )}
                              {p.error && (
                                <div className="absolute inset-0 bg-red-500/60 flex items-center justify-center">
                                  <span className="text-white text-[10px] font-semibold text-center px-1">{p.error}</span>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removePhoto(i)}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center transition-colors"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {photos.length < 5 && (
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-slate-200 hover:border-sky-400 hover:text-sky-600 text-slate-500 text-sm rounded-xl transition-colors w-full justify-center"
                        >
                          <Camera className="w-4 h-4" />
                          {photos.length === 0 ? "Ajouter des photos" : `Ajouter (${photos.length}/5)`}
                        </button>
                      )}
                    </div>

                    {photoWarning && (
                      <p className="text-amber-300 text-sm bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">{photoWarning}</p>
                    )}
                    {submitError && (
                      <p className="text-red-300 text-sm bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
                        {submitError} <a href="tel:+33667432767" className="underline font-semibold whitespace-nowrap">06 67 43 27 67</a>
                      </p>
                    )}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-sky-500 hover:bg-sky-400 disabled:opacity-60 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/25"
                    >
                      {loading ? "Envoi en cours…" : submitError ? "Réessayer" : "Envoyer ma demande"}
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

        {/* FAQ SEO */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-3">Questions fréquentes</span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Tout savoir sur notre processus de devis</h2>
            </div>
            <div className="space-y-4">
              {[
                { q: "Est-ce que le devis est vraiment gratuit ?", a: "Oui, le devis est 100% gratuit et sans engagement. Nous vous envoyons une proposition détaillée sous 24h après étude de votre projet." },
                { q: "Dans quel délai recevez-vous le devis ?", a: "Vous recevez votre devis sous 24h ouvrées. Pour les projets complexes (gainable, PAC), une visite technique gratuite peut être proposée avant chiffrage." },
                { q: "Quelles zones géographiques couvrez-vous ?", a: "ClimExpert intervient dans toute l'Île-de-France : Paris, Hauts-de-Seine, Val-de-Marne, Seine-Saint-Denis, Yvelines, Essonne, Seine-et-Marne et Val-d'Oise." },
                { q: "Puis-je joindre des photos à ma demande de devis ?", a: "Oui, vous pouvez ajouter jusqu'à 5 photos (pièce à climatiser, emplacement envisagé, tableau électrique…). Cela permet un chiffrage plus précis sans déplacement préalable." },
                { q: "Le devis inclut-il les aides financières disponibles ?", a: "Oui, notre devis détaille toutes les aides applicables à votre projet : MaPrimeRénov', CEE, éco-prêt à taux zéro. Nos techniciens RGE vous permettent d'y accéder directement." },
              ].map(({ q, a }) => (
                <details key={q} className="group bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
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
