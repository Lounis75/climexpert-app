import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle2, ArrowRight, MapPin, Wrench, Thermometer, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { VILLES, getVilleBySlug } from "@/lib/villes";
import { DEPARTEMENTS } from "@/lib/departements";

export async function generateStaticParams() {
  return VILLES.map((v) => ({ ville: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ville: string }>;
}): Promise<Metadata> {
  const { ville: slug } = await params;
  const ville = getVilleBySlug(slug);
  if (!ville) return {};

  const title = `Climatisation ${ville.name} — Installation & Entretien`;
  const description = `Installateur climatisation à ${ville.name} (${ville.dept}). Techniciens RGE certifiés, devis gratuit sous 24h. Monosplit, multisplit, gainable — intervention rapide en ${ville.depName}.`;

  return {
    title,
    description,
    keywords: `climatisation ${ville.name.toLowerCase()}, installation climatisation ${ville.name.toLowerCase()}, climatiseur ${ville.name.toLowerCase()}, entretien climatisation ${ville.dept}, installateur clim ${ville.name.toLowerCase()}`,
    alternates: { canonical: `https://climexpert.fr/villes/${ville.slug}` },
    openGraph: {
      title: `Climatisation ${ville.name} — ClimExpert`,
      description,
      url: `https://climexpert.fr/villes/${ville.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
  };
}

export default async function VillePage({
  params,
}: {
  params: Promise<{ ville: string }>;
}) {
  const { ville: slug } = await params;
  const ville = getVilleBySlug(slug);
  if (!ville) notFound();

  // Maillage interne : zones du même département (mesh complet) + lien vers le département.
  const nearby = VILLES.filter((v) => v.dept === ville.dept && v.slug !== ville.slug);
  const deptSlug = DEPARTEMENTS.find((d) => d.code === ville.dept)?.slug;

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: "https://climexpert.fr" },
      { "@type": "ListItem", position: 2, name: "Villes", item: "https://climexpert.fr/villes" },
      { "@type": "ListItem", position: 3, name: ville.name, item: `https://climexpert.fr/villes/${ville.slug}` },
    ],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Installation climatisation à ${ville.name}`,
    description: `Installation, entretien et dépannage climatisation à ${ville.name} (${ville.dept}) par des techniciens RGE certifiés.`,
    provider: {
      "@type": "HVACBusiness",
      name: "ClimExpert",
      url: "https://climexpert.fr",
      telephone: "+33667432767",
      areaServed: { "@type": "City", name: ville.name },
    },
    areaServed: { "@type": "City", name: ville.name },
    serviceType: "Installation climatisation",
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      priceRange: "1500-8000",
      availability: "https://schema.org/InStock",
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Quel est le prix d'une installation climatisation à ${ville.name} ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Le prix d'une installation climatisation à ${ville.name} dépend du type de système : monosplit de 1 500 à 2 500 € TTC, multisplit 2 pièces de 2 800 à 4 000 € TTC, multisplit 3 pièces de 3 800 à 5 500 € TTC. Ces tarifs incluent le matériel, la main-d'œuvre et la mise en service. Un devis précis est réalisé lors de la visite technique gratuite.`,
        },
      },
      {
        "@type": "Question",
        name: ville.faqQ,
        acceptedAnswer: { "@type": "Answer", text: ville.faqA },
      },
      {
        "@type": "Question",
        name: `Combien de temps dure une installation climatisation à ${ville.name} ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Une installation monosplit standard à ${ville.name} prend généralement une demi-journée (3 à 5 heures). Un multisplit 2 ou 3 pièces nécessite une journée complète. Nos techniciens interviennent en général sous 48h après acceptation du devis.`,
        },
      },
    ],
  };

  const services = [
    {
      icon: Thermometer,
      color: "sky",
      title: "Installation",
      body: `Monosplit, multisplit et gainable. Installation propre et soignée à ${ville.name} avec mise en service complète.`,
    },
    {
      icon: Wrench,
      color: "amber",
      title: "Entretien",
      body: `Contrats de maintenance annuelle à partir de 200 € TTC/unité. Nettoyage filtres, contrôle circuit frigorigène, rapport de visite.`,
    },
    {
      icon: ShieldCheck,
      color: "emerald",
      title: "Dépannage",
      body: `Intervention sous 48h à ${ville.name}. Diagnostic, réparation et remplacement de pièces toutes marques.`,
    },
    {
      icon: MapPin,
      color: "violet",
      title: `${ville.depName} (${ville.dept})`,
      body: `Techniciens basés en Île-de-France, intervention rapide dans tout le département ${ville.dept} et communes limitrophes.`,
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Header />

      {/* Dark hero */}
      <section className="bg-[#0B1120] border-b border-white/8 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-4">
              <MapPin className="w-3.5 h-3.5" />
              {ville.name} · {ville.depName} ({ville.dept})
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
              Climatisation {ville.name}
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed mb-6">
              Installation, entretien et dépannage par des techniciens certifiés RGE.
              Devis gratuit sous 24h — intervention rapide à {ville.name}.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/devis"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-sky-500/20"
              >
                Devis gratuit à {ville.name}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/33667432767"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/8 hover:bg-white/12 text-white font-semibold rounded-xl border border-white/15 transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <main className="bg-slate-50">
        {/* Services grid */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {services.map(({ icon: Icon, color, title, body }) => (
                <div
                  key={title}
                  className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-200"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                      color === "sky"
                        ? "bg-sky-50 border border-sky-100"
                        : color === "emerald"
                        ? "bg-emerald-50 border border-emerald-100"
                        : color === "amber"
                        ? "bg-amber-50 border border-amber-100"
                        : "bg-violet-50 border border-violet-100"
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${
                        color === "sky"
                          ? "text-sky-600"
                          : color === "emerald"
                          ? "text-emerald-600"
                          : color === "amber"
                          ? "text-amber-600"
                          : "text-violet-600"
                      }`}
                    />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Context local */}
        <section className="py-12 bg-white border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Installateur climatisation à {ville.name}
              </h2>
              <p className="text-slate-600 leading-relaxed text-lg">{ville.context}</p>
            </div>
          </div>
        </section>

        {/* Inclus */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
              Ce qui est inclus dans votre installation
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Matériel & équipement", body: "Unité intérieure et extérieure, câblage, supports de fixation anti-vibrations." },
                { title: "Main-d'œuvre complète", body: "Pose, passage des liaisons frigorifiques, raccordement électrique." },
                { title: "Mise en service", body: "Contrôle étanchéité, tirage au vide, charge en fluide R32, tests de fonctionnement." },
                { title: "Garanties", body: "Garantie 2 ans pièces et main-d'œuvre. Extension possible avec contrat entretien." },
              ].map(({ title, body }) => (
                <div key={title} className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 mb-3" />
                  <h3 className="font-semibold text-slate-900 text-sm mb-1.5">{title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">
              Questions fréquentes — {ville.name}
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: `Quel est le prix d'une installation climatisation à ${ville.name} ?`,
                  a: `Le prix dépend du type de système : monosplit de 1 500 à 2 500 € TTC, multisplit 2 pièces de 2 800 à 4 000 € TTC, multisplit 3 pièces de 3 800 à 5 500 € TTC. Ces tarifs incluent le matériel, la main-d'œuvre et la mise en service. Un devis précis est réalisé lors de la visite technique gratuite.`,
                },
                {
                  q: ville.faqQ,
                  a: ville.faqA,
                },
                {
                  q: `Combien de temps dure une installation climatisation à ${ville.name} ?`,
                  a: `Une installation monosplit standard à ${ville.name} prend généralement une demi-journée (3 à 5 heures). Un multisplit 2 ou 3 pièces nécessite une journée complète. Nos techniciens interviennent en général sous 48h après acceptation du devis.`,
                },
              ].map(({ q, a }) => (
                <details
                  key={q}
                  className="group bg-slate-50 rounded-xl border border-slate-200 overflow-hidden"
                >
                  <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none font-semibold text-slate-900 text-sm">
                    {q}
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200 group-open:bg-sky-100 flex items-center justify-center transition-colors">
                      <svg
                        className="w-3 h-3 text-slate-500 group-open:text-sky-600 group-open:rotate-180 transition-all"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-5 pb-5 pt-1 text-slate-600 text-sm leading-relaxed">{a}</div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Maillage interne : zones d'intervention proches */}
        {nearby.length > 0 && (
          <section className="py-16 bg-white border-t border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Climatisation dans les environs</h2>
              <p className="text-slate-500 mb-6">
                Nous intervenons aussi à proximité de {ville.name}, dans tout le {ville.depName} ({ville.dept}).
              </p>
              <div className="flex flex-wrap gap-2">
                {nearby.map((v) => (
                  <Link
                    key={v.slug}
                    href={`/villes/${v.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 text-slate-700 hover:text-sky-700 text-sm font-medium transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-slate-400" /> {v.name}
                  </Link>
                ))}
              </div>
              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                {deptSlug && (
                  <Link href={`/departements/${deptSlug}`} className="text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1">
                    Climatisation {ville.depName} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
                <Link href="/villes" className="text-sky-600 hover:text-sky-700 font-medium inline-flex items-center gap-1">
                  Toutes nos zones d&apos;intervention <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* CTA final */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Besoin d&apos;un devis à {ville.name} ?
            </h2>
            <p className="text-slate-500 mb-8">
              Réponse sous 24h · Techniciens RGE · Intervention sous 48h
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/devis"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-sky-500/20"
              >
                Demander un devis gratuit
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="https://wa.me/33667432767"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 transition-colors"
              >
                WhatsApp direct
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
