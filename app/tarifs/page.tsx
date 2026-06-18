import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tarifs Climatisation Île-de-France 2026 — Prix Installation & Entretien",
  description:
    "Découvrez les prix d'installation climatisation en Île-de-France : monosplit à partir de 1 500 €, multisplit à partir de 2 800 €, entretien à partir de 180 €. Devis gratuit sous 24h.",
  keywords:
    "prix climatisation ile-de-france, tarif installation climatisation, coût climatisation paris, tarif entretien climatisation, prix monosplit multisplit gainable",
  alternates: { canonical: "https://climexpert.fr/tarifs" },
  openGraph: {
    title: "Tarifs Climatisation Île-de-France 2026 — ClimExpert",
    description: "Prix installation, entretien et dépannage climatisation en IDF. Monosplit à partir de 1 500 €.",
    url: "https://climexpert.fr/tarifs",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://climexpert.fr" },
    { "@type": "ListItem", position: 2, name: "Tarifs", item: "https://climexpert.fr/tarifs" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Quel est le prix d'une installation climatisation en Île-de-France ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les tarifs d'installation varient selon le système : monosplit à partir de 1 500 € TTC, multisplit 2 pièces à partir de 2 800 € TTC, multisplit 3 pièces à partir de 3 800 € TTC, gainable à partir de 4 000 € TTC. Ces prix incluent le matériel, la main-d'œuvre, les raccordements et la mise en service.",
      },
    },
    {
      "@type": "Question",
      name: "Combien coûte un entretien de climatisation ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "L'entretien annuel d'une unité climatisation est à partir de 180 € TTC pour une unité à Paris intramuros. Des majorations s'appliquent selon la distance et l'accessibilité (+60 € TTC par unité supplémentaire). Le contrat comprend nettoyage, vérification électrique, test des modes et rapport signé.",
      },
    },
    {
      "@type": "Question",
      name: "Le prix inclut-il la pose ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, tous nos tarifs incluent le matériel, la main-d'œuvre, les raccordements frigorifiques et électriques, le percement mural et la mise en service complète. Aucun frais caché.",
      },
    },
    {
      "@type": "Question",
      name: "Y a-t-il des aides financières pour réduire le coût ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les pompes à chaleur air-eau sont éligibles à MaPrimeRénov' (jusqu'à 4 000 €) et aux CEE (200 à 800 €). Les climatiseurs réversibles (air-air) bénéficient des CEE et d'aides locales. Côté TVA, la pose bénéficie d'un taux réduit (10 % pour une clim réversible, 5,5 % pour une PAC air-eau) dans les logements de plus de 2 ans. Nos techniciens RGE gèrent les dossiers.",
      },
    },
    {
      "@type": "Question",
      name: "Peut-on payer en plusieurs fois ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, le paiement s'effectue en deux fois : 30 % à la commande et 70 % à la livraison et mise en service. Aucun frais supplémentaire.",
      },
    },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Installation climatisation Île-de-France",
  serviceType: "Installation et entretien climatisation",
  provider: {
    "@type": "HVACBusiness",
    "@id": "https://climexpert.fr",
    name: "ClimExpert",
    telephone: "+33667432767",
  },
  areaServed: { "@type": "AdministrativeArea", name: "Île-de-France" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: "180",
    highPrice: "15000",
  },
  url: "https://climexpert.fr/tarifs",
};

const TARIFS = [
  {
    system: "Monosplit",
    desc: "1 pièce — salon, chambre, bureau",
    price: "1 500 – 2 500 €",
    details: ["1 unité intérieure", "1 unité extérieure", "jusqu'à 35 m²", "Pose incluse"],
    color: "sky",
    popular: false,
  },
  {
    system: "Multisplit 2 pièces",
    desc: "Salon + chambre ou 2 pièces",
    price: "2 800 – 4 000 €",
    details: ["2 unités intérieures", "1 unité extérieure compacte", "jusqu'à 60 m²", "Pose incluse"],
    color: "emerald",
    popular: true,
  },
  {
    system: "Multisplit 3 pièces",
    desc: "Appartement ou maison 3 pièces",
    price: "3 800 – 5 500 €",
    details: ["3 unités intérieures", "1 unité extérieure puissante", "jusqu'à 90 m²", "Pose incluse"],
    color: "emerald",
    popular: false,
  },
  {
    system: "Multisplit 4–6 pièces",
    desc: "Grande maison, appartement familial",
    price: "4 500 – 8 000 €",
    details: ["4 à 6 unités intérieures", "1 unité extérieure haute capacité", "jusqu'à 180 m²", "Pose incluse"],
    color: "violet",
    popular: false,
  },
  {
    system: "Gainable",
    desc: "Maison avec faux-plafond ou combles",
    price: "4 000 – 10 000 €",
    details: ["1 unité gainable centralisée", "Diffusion invisible", "Toute surface", "Étude technique incluse"],
    color: "amber",
    popular: false,
  },
  {
    system: "PAC air-eau",
    desc: "Remplacement chauffage principal",
    price: "8 000 – 15 000 €",
    details: ["Chauffage + ECS", "Éligible MaPrimeRénov'", "CEE + aides État", "Étude thermique incluse"],
    color: "rose",
    popular: false,
  },
];

const SERVICES = [
  {
    title: "Entretien annuel",
    price: "À partir de 180 € TTC",
    sub: "par unité · Paris intramuros",
    items: [
      "Nettoyage filtres, évaporateur, condenseur",
      "Vérification pompe de relevage",
      "Contrôle absence de fuites",
      "Vérification électrique",
      "Test modes chaud et froid",
      "Rapport d'intervention signé",
    ],
  },
  {
    title: "Dépannage",
    price: "Diagnostic offert",
    sub: "si réparation acceptée",
    items: [
      "Diagnostic complet",
      "Intervention sous 48h en IDF",
      "7j/7 en urgence",
      "Toutes marques",
      "Pièces détachées originales",
      "Garantie 3 mois sur la réparation",
    ],
  },
];

export default function TarifsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Header />
      <main>
        <div className="bg-[#0B1120] pt-28 pb-14">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center mt-6">
            <span className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-5">
              Tarifs 2026 · Île-de-France
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight tracking-tight mb-4">
              Prix climatisation<br />
              <span className="text-sky-400">en Île-de-France</span>
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Tarifs pose incluse, sans frais cachés. Paiement en 2 fois. TVA réduite (10 % sur la pose d'une clim réversible, 5,5 % pour une PAC air-eau) pour les logements de plus de 2 ans.
            </p>
          </div>
        </div>

        {/* Grille tarifs installation */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Installation climatisation</h2>
            <p className="text-slate-500 text-center mb-10">Matériel + main-d'œuvre + raccordements + mise en service</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {TARIFS.map((t) => (
                <div
                  key={t.system}
                  className={`relative bg-white rounded-2xl border p-6 shadow-sm flex flex-col ${
                    t.popular ? "border-sky-400 ring-2 ring-sky-100" : "border-slate-200"
                  }`}
                >
                  {t.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      Le plus demandé
                    </span>
                  )}
                  <div className="mb-4">
                    <p className="font-bold text-slate-900 text-base">{t.system}</p>
                    <p className="text-slate-400 text-sm mt-0.5">{t.desc}</p>
                  </div>
                  <p className="text-2xl font-extrabold text-slate-900 mb-4">
                    {t.price} <span className="text-sm font-normal text-slate-400">TTC</span>
                  </p>
                  <ul className="space-y-2 flex-1 mb-6">
                    {t.details.map((d) => (
                      <li key={d} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-sky-500 flex-shrink-0" />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/devis"
                    className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 text-sm font-semibold border border-sky-200 transition-colors"
                  >
                    Devis gratuit <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-400 text-sm mt-6">
              * Tarifs indicatifs. Le prix final dépend de la configuration du logement, de la marque choisie et des conditions d'accès.
            </p>
          </div>
        </section>

        {/* Entretien & Dépannage */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-2 text-center">Entretien & dépannage</h2>
            <p className="text-slate-500 text-center mb-10">Maintenance et interventions sur toutes marques en Île-de-France</p>
            <div className="grid sm:grid-cols-2 gap-6">
              {SERVICES.map((s) => (
                <div key={s.title} className="bg-slate-50 rounded-2xl border border-slate-200 p-6">
                  <h3 className="font-bold text-slate-900 text-base mb-1">{s.title}</h3>
                  <p className="text-xl font-extrabold text-sky-600 mb-0.5">{s.price}</p>
                  <p className="text-slate-400 text-xs mb-4">{s.sub}</p>
                  <ul className="space-y-2">
                    {s.items.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ce qui est inclus */}
        <section className="py-16 bg-slate-50 border-t border-slate-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Ce qui est toujours inclus</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Matériel neuf", desc: "Garantie fabricant complète sur tous les équipements" },
                { title: "Main-d'œuvre", desc: "Techniciens RGE certifiés fluides frigorigènes cat. I" },
                { title: "Raccordements", desc: "Liaisons frigorifiques, électriques et évacuation condensats" },
                { title: "Mise en service", desc: "Test complet, réglages et formation à l'utilisation" },
              ].map((item) => (
                <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-sky-500 mb-2" />
                  <p className="font-semibold text-slate-900 text-sm mb-1">{item.title}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 bg-sky-50 border border-sky-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1">
                <p className="font-bold text-slate-900 mb-1">Paiement en 2 fois · Aucun frais caché</p>
                <p className="text-slate-500 text-sm">30 % à la commande, 70 % à la livraison. TVA réduite (10 % sur la pose d'une clim réversible, 5,5 % pour une PAC air-eau) pour les logements de plus de 2 ans.</p>
              </div>
              <Link
                href="/devis"
                className="flex-shrink-0 flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-sky-500/20"
              >
                Devis gratuit sous 24h <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 bg-white border-t border-slate-100">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Questions sur nos tarifs</h2>
            <div className="space-y-3">
              {faqSchema.mainEntity.map(({ name, acceptedAnswer }) => (
                <details key={name} className="group bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none">
                    <span className="text-slate-900 text-sm font-medium pr-4">{name}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0 group-open:rotate-90 transition-transform" />
                  </summary>
                  <p className="px-5 pb-4 text-slate-600 text-sm leading-relaxed">{acceptedAnswer.text}</p>
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
