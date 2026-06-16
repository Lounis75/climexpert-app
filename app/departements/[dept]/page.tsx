import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IleDeFranceMap from "@/components/IleDeFranceMap";
import { CheckCircle2, ArrowRight, MapPin, Wrench, Thermometer, ShieldCheck, Users } from "lucide-react";
import { DEPARTEMENTS, getDepartementBySlug, getVillesByDept } from "@/lib/departements";

const BASE = "https://climexpert.fr";

export async function generateStaticParams() {
  return DEPARTEMENTS.map((d) => ({ dept: d.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dept: string }>;
}): Promise<Metadata> {
  const { dept: slug } = await params;
  const dept = getDepartementBySlug(slug);
  if (!dept) return {};

  const title = `Climatisation ${dept.name} (${dept.code}) — Installation & Entretien | ClimExpert`;
  const description = `Installateur climatisation dans le ${dept.code} — ${dept.name}. Techniciens RGE certifiés, devis gratuit sous 24h. Monosplit, multisplit, gainable — intervention rapide dans tout le département.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE}/departements/${dept.slug}` },
    openGraph: {
      title: `Climatisation ${dept.name} (${dept.code}) — ClimExpert`,
      description,
      url: `${BASE}/departements/${dept.slug}`,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
  };
}

export default async function DepartementPage({
  params,
}: {
  params: Promise<{ dept: string }>;
}) {
  const { dept: slug } = await params;
  const dept = getDepartementBySlug(slug);
  if (!dept) notFound();

  const villes = getVillesByDept(dept.code);

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Accueil", item: BASE },
      { "@type": "ListItem", position: 2, name: "Départements", item: `${BASE}/departements` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${dept.name} (${dept.code})`,
        item: `${BASE}/departements/${dept.slug}`,
      },
    ],
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Installation climatisation ${dept.name} (${dept.code})`,
    description: `Installation, entretien et dépannage climatisation dans le département ${dept.name} (${dept.code}) par des techniciens RGE certifiés.`,
    provider: {
      "@type": "HVACBusiness",
      name: "ClimExpert",
      url: BASE,
      telephone: "+33667432767",
      areaServed: {
        "@type": "AdministrativeArea",
        name: dept.name,
      },
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: dept.name,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: "Île-de-France",
      },
    },
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
    mainEntity: dept.faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

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

      {/* Hero */}
      <section className="bg-[#0B1120] border-b border-white/8 pt-24 pb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mt-8 grid lg:grid-cols-2 gap-12 items-end">
            {/* Left: text */}
            <div className="pb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-4">
                <MapPin className="w-3.5 h-3.5" />
                Département {dept.code} · {dept.name}
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight mb-4">
                Climatisation<br />
                <span className="text-sky-400">{dept.name}</span>{" "}
                <span className="text-slate-400">({dept.code})</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-6">
                Installation, entretien et dépannage par des techniciens RGE certifiés.
                Devis gratuit sous 24h — intervention rapide dans tout le département.
              </p>

              <div className="grid grid-cols-2 gap-3 mb-8">
                {[
                  { label: "Population", value: dept.population },
                  { label: "Communes", value: `${dept.communes} communes` },
                  { label: "Délai d'intervention", value: "< 48h" },
                  { label: "Devis gratuit", value: "Sous 24h" },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-white/5 rounded-xl border border-white/8 px-4 py-3">
                    <p className="text-slate-500 text-xs mb-0.5">{label}</p>
                    <p className="text-white font-semibold text-sm">{value}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/devis"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-sky-500/20"
                >
                  Devis gratuit en {dept.name}
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

            {/* Right: map */}
            <div className="flex justify-center lg:justify-end pb-0">
              <div className="relative">
                <IleDeFranceMap
                  highlightedDept={dept.code}
                  className="w-full max-w-sm lg:max-w-md h-auto drop-shadow-2xl"
                />
                <div className="absolute -bottom-px left-0 right-0 h-8 bg-gradient-to-t from-[#0B1120] to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="bg-slate-50">
        {/* Highlights */}
        <section className="py-14 bg-white border-b border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dept.highlights.map((h) => (
                <div key={h} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                  <p className="text-slate-700 text-sm leading-relaxed">{h}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Context */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-4">
                  Installateur climatisation en {dept.name}
                </h2>
                <p className="text-slate-600 leading-relaxed text-lg">{dept.context}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  {
                    icon: Thermometer,
                    color: "sky",
                    title: "Installation",
                    body: `Monosplit, multisplit et gainable. Pose soignée en ${dept.name} avec mise en service complète.`,
                  },
                  {
                    icon: Wrench,
                    color: "amber",
                    title: "Entretien",
                    body: "Contrats maintenance annuelle. Nettoyage filtres, contrôle circuit frigorigène, rapport de visite.",
                  },
                  {
                    icon: ShieldCheck,
                    color: "emerald",
                    title: "Dépannage",
                    body: `Intervention sous 48h en ${dept.name}. Diagnostic, réparation et remplacement toutes marques.`,
                  },
                  {
                    icon: Users,
                    color: "violet",
                    title: "Techniciens RGE",
                    body: "Certifiés RGE pour l'éligibilité aux aides CEE et MaPrimeRénov'. Garantie 2 ans.",
                  },
                ].map(({ icon: Icon, color, title, body }) => (
                  <div
                    key={title}
                    className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm"
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                        color === "sky" ? "bg-sky-50 border border-sky-100" :
                        color === "emerald" ? "bg-emerald-50 border border-emerald-100" :
                        color === "amber" ? "bg-amber-50 border border-amber-100" :
                        "bg-violet-50 border border-violet-100"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          color === "sky" ? "text-sky-600" :
                          color === "emerald" ? "text-emerald-600" :
                          color === "amber" ? "text-amber-600" :
                          "text-violet-600"
                        }`}
                      />
                    </div>
                    <h3 className="font-semibold text-slate-900 mb-1.5 text-sm">{title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Villes couvertes */}
        {villes.length > 0 && (
          <section className="py-14 bg-white border-y border-slate-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Villes couvertes en {dept.name}
              </h2>
              <p className="text-slate-500 mb-8 text-sm">
                Retrouvez les informations spécifiques à votre commune.
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {villes.map((ville) => (
                  <Link
                    key={ville.slug}
                    href={`/villes/${ville.slug}`}
                    className="group flex items-center justify-between gap-3 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 rounded-xl px-4 py-3 transition-all duration-150"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-slate-400 group-hover:text-sky-500 flex-shrink-0 transition-colors" />
                      <span className="font-medium text-slate-800 group-hover:text-sky-700 text-sm transition-colors">
                        {ville.name}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-400 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

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
              Questions fréquentes — {dept.name}
            </h2>
            <div className="space-y-4">
              {dept.faqItems.map(({ q, a }) => (
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

        {/* CTA */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">
              Besoin d&apos;un devis en {dept.name} ?
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
