import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Lightbulb,
  Euro,
  Leaf,
  ThumbsUp,
  Clock,
  Tag,
  TrendingUp,
  Sparkles,
  Calculator as CalculatorIcon,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FAQAccordion from "@/components/FAQAccordion";
import TableOfContents from "@/components/TableOfContents";
import Calculator from "@/components/Calculator";
import { articles } from "@/lib/articles";
import { getFeaturedSlugs } from "@/lib/kv";
import { getDynamicArticles } from "@/lib/dynamicArticles";

export const revalidate = 60;
import PageCTA from "@/components/PageCTA";

export const metadata: Metadata = {
  title: "Guide Climatisation 2025 : Tout Savoir Avant de Se Lancer | ClimExpert",
  description:
    "Guide complet sur la climatisation en Île-de-France : types de systèmes, prix, aides financières, entretien. Tout ce qu'il faut savoir pour bien choisir sa climatisation.",
  keywords:
    "guide climatisation, choisir climatisation, prix climatisation, aide climatisation maprimerenov, climatisation appartement, monosplit multisplit gainable",
  alternates: {
    canonical: "https://climexpert.fr/guide-climatisation",
  },
  openGraph: {
    title: "Guide Climatisation 2025 — ClimExpert",
    description:
      "Types de systèmes, prix, aides financières, entretien… Le guide complet pour bien choisir votre climatisation.",
    url: "https://climexpert.fr/guide-climatisation",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

const systems = [
  {
    name: "Monosplit",
    ideal: "1 pièce",
    price: "1 500 – 2 500 €",
    pros: ["Prix d'entrée accessible", "Installation simple", "Idéal studio ou chambre"],
    cons: ["1 seule pièce couverte", "Unité extérieure visible"],
  },
  {
    name: "Multisplit",
    ideal: "2 à 4 pièces",
    price: "2 800 – 6 000 €",
    pros: ["1 seule unité extérieure", "Chaque pièce réglée indépendamment", "Économique à l'usage"],
    cons: ["Coût initial plus élevé", "Installation plus complexe"],
  },
  {
    name: "Gainable",
    ideal: "Toute la maison",
    price: "4 000 – 10 000 €",
    pros: ["Totalement invisible", "Diffusion homogène", "Discret et silencieux"],
    cons: ["Nécessite un faux-plafond", "Coût élevé", "Maintenance plus technique"],
  },
  {
    name: "PAC air-eau",
    ideal: "Maison individuelle",
    price: "8 000 – 15 000 €",
    pros: ["Chauffage + ECS + climatisation", "Éligible MaPrimeRénov'", "Très économique"],
    cons: ["Investissement important", "Travaux de plomberie requis"],
  },
];

const criteria = [
  {
    icon: Euro,
    title: "Votre budget",
    desc: "Comptez entre 1 500 € et 15 000 € selon le type de système. Pensez au coût total sur 10 ans : un système plus cher à l'achat peut être plus économique à l'usage.",
  },
  {
    icon: ThumbsUp,
    title: "Surface à climatiser",
    desc: "Un monosplit de 2,5 kW couvre environ 20-25 m². Pour un appartement de 70 m² avec 3 pièces, un multisplit 3 têtes est souvent la solution idéale.",
  },
  {
    icon: Lightbulb,
    title: "Type de bien",
    desc: "Appartement, maison, local professionnel : les contraintes varient (syndicat, façade, gaines). Une étude technique gratuite permet d'éviter les mauvaises surprises.",
  },
  {
    icon: Leaf,
    title: "Efficacité énergétique",
    desc: "Privilégiez les systèmes avec un SEER ≥ 6,2 et un SCOP ≥ 3,8. Ils consomment 3 à 4 fois moins d'énergie qu'un chauffage électrique classique.",
  },
];

const aids = [
  {
    name: "MaPrimeRénov'",
    amount: "Jusqu'à 4 000 €",
    condition: "PAC air-eau uniquement, sous conditions de ressources",
    color: "sky",
  },
  {
    name: "CEE (Certificats d'Économies d'Énergie)",
    amount: "200 – 800 €",
    condition: "PAC air-air et air-eau, via votre installateur RGE",
    color: "emerald",
  },
  {
    name: "TVA à 5,5 %",
    amount: "Économie sur la TVA",
    condition: "Logement de plus de 2 ans, travaux de rénovation énergétique",
    color: "amber",
  },
  {
    name: "Aides locales",
    amount: "Variable",
    condition: "Certaines communes et régions proposent des compléments d'aide",
    color: "slate",
  },
];

const faqItems = [
  {
    question: "Quelle climatisation choisir pour un appartement à Paris ?",
    answer:
      "Pour un appartement parisien, le monosplit (1 pièce) ou le multisplit (plusieurs pièces) sont les solutions les plus adaptées. Le gainable est possible si vous avez un faux-plafond. La PAC air-eau est plutôt réservée aux maisons individuelles. Comptez entre 1 500 € et 5 000 € selon le nombre de pièces à climatiser.",
  },
  {
    question: "La climatisation réversible peut-elle remplacer le chauffage ?",
    answer:
      "Oui, les climatisations réversibles modernes fonctionnent efficacement jusqu'à -15°C. Elles produisent 3 à 5 kWh de chaleur pour 1 kWh électrique consommé (COP de 3 à 5). En complément d'un chauffage principal, elles peuvent diviser votre facture de chauffage par 3.",
  },
  {
    question: "Faut-il un technicien certifié pour installer une climatisation ?",
    answer:
      "Oui, obligatoirement. La manipulation des fluides frigorigènes est réglementée par la directive européenne F-Gaz. Seuls les techniciens titulaires de l'attestation de capacité sont autorisés à manipuler ces gaz. Faire appel à un technicien non certifié vous expose à des problèmes d'assurance et de garantie.",
  },
  {
    question: "Quelle est la consommation électrique d'une climatisation ?",
    answer:
      "Un monosplit 2,5 kW consomme environ 800 W à pleine puissance. En usage courant (8h/jour, 3 mois/an), cela représente 200 à 400 kWh par an, soit 30 à 60 € sur votre facture. Les systèmes inverter modernes réduisent cette consommation de 30 à 40 %.",
  },
  {
    question: "Peut-on installer une climatisation en copropriété ?",
    answer:
      "Oui, mais l'accord de l'assemblée générale est nécessaire pour poser une unité extérieure sur une façade commune ou un toit. En revanche, si l'unité extérieure se trouve sur votre balcon privatif et que les travaux ne modifient pas l'aspect extérieur de l'immeuble, une simple déclaration au syndic peut suffire. Nous vous accompagnons dans ces démarches.",
  },
  {
    question: "Combien de temps dure une climatisation ?",
    answer:
      "Une climatisation bien entretenue dure entre 12 et 20 ans. L'entretien annuel est le facteur clé de longévité. Sans entretien, la durée de vie peut être réduite de moitié. Nos contrats de maintenance à partir de 180 € TTC/unité/an protègent votre investissement.",
  },
  {
    question: "Quand est-il préférable d'installer une climatisation ?",
    answer:
      "Le printemps (mars-mai) est idéal : les techniciens sont disponibles avant la saison chaude, et vous profitez de la climatisation dès l'été. En automne, vous pouvez également préparer l'hiver avec le mode chauffage réversible. Évitez juin-août, période de forte demande où les délais s'allongent.",
  },
];

const tocItems = [
  { id: "entretien", label: "L'entretien annuel" },
  { id: "prix", label: "Combien ça coûte ?" },
  { id: "aides", label: "Les aides financières" },
];

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://climexpert.fr" },
    { "@type": "ListItem", position: 2, name: "Guide climatisation", item: "https://climexpert.fr/guide-climatisation" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default async function GuidePage() {
  const [featuredSlugs, dynamicArticles] = await Promise.all([
    getFeaturedSlugs(),
    getDynamicArticles(),
  ]);

  const dynamicSlugs = new Set(dynamicArticles.map((a) => a.slug));
  const allArticles = [
    ...dynamicArticles,
    ...articles.filter((a) => !dynamicSlugs.has(a.slug)),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const featuredArticles = featuredSlugs
    .map((slug) => allArticles.find((a) => a.slug === slug))
    .filter(Boolean) as typeof allArticles;

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Articles guide climatisation ClimExpert",
    url: "https://climexpert.fr/guide-climatisation",
    numberOfItems: allArticles.length,
    itemListElement: allArticles.map((article, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: article.title,
      url: `https://climexpert.fr/guide-climatisation/${article.slug}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <Header />
      <main>

        {/* ── Hero ── */}
        <section className="bg-[#0B1120] pt-28 pb-16 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid opacity-50" />
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <span className="inline-block px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-sm font-medium mb-6">
                Guides & Conseils · Île-de-France
              </span>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-5 tracking-tight leading-[1.1]">
                Climatisation :<br />
                <span className="text-gradient">tout savoir avant de se lancer</span>
              </h1>
              <p className="text-slate-400 text-lg leading-relaxed mb-8">
                Types de systèmes, prix, aides financières, entretien… Tous nos guides rédigés par des techniciens certifiés RGE pour vous aider à faire le bon choix.
              </p>
              <div className="flex flex-wrap items-center gap-5 text-sm text-slate-500">
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-500" /> Techniciens RGE Qualibat</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-500" /> Tarifs IDF 2026</span>
                <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-sky-500" /> Mis à jour régulièrement</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Bandeau Guide 2026 + pills à la une ── */}
        <div className="bg-slate-900 border-b border-white/10 sticky top-16 lg:top-20 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 py-3 overflow-x-auto no-scrollbar">
              <span className="flex-shrink-0 text-white font-bold text-sm tracking-tight pr-4 border-r border-white/15">
                Guide <span className="text-sky-400">2026</span>
              </span>

              {/* Calculateur — pill spécial */}
              <a
                href="#calculateur"
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 hover:text-sky-100 hover:bg-sky-500/25 text-xs font-semibold transition-colors whitespace-nowrap"
              >
                <CalculatorIcon className="w-3 h-3" />
                Calculateur
              </a>

              {/* Articles à la une depuis le backoffice */}
              {featuredArticles.length > 0 && (
                <>
                  {featuredArticles.map((article, i) => (
                    <a
                      key={article.slug}
                      href={`/guide-climatisation/${article.slug}`}
                      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                        i === 0
                          ? "bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:text-amber-200 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:text-emerald-200 hover:bg-emerald-500/20"
                      }`}
                    >
                      {i === 0 ? <TrendingUp className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                      <span className="max-w-[120px] truncate">{article.title.split(":")[0].trim()}</span>
                    </a>
                  ))}
                  <span className="flex-shrink-0 w-px h-4 bg-white/10" />
                </>
              )}

              {/* Liens de section */}
              {tocItems.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  className="flex-shrink-0 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors whitespace-nowrap"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Guide complet ── */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
              <TableOfContents />

              {/* Article */}
              <article className="flex-1 min-w-0 prose-custom">

                {/* 1. Types */}
                <section id="types" className="mb-16 scroll-mt-24">
                  <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-semibold border border-sky-100 mb-4">
                    Chapitre 1
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                    Les types de climatisation
                  </h2>
                  <p className="text-slate-600 mb-8 leading-relaxed">
                    Il existe quatre grandes familles de systèmes de climatisation. Le choix dépend de votre type de logement, du nombre de pièces à traiter et de votre budget.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {systems.map((s) => (
                      <div key={s.name} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-bold text-slate-900 text-lg">{s.name}</h3>
                          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">
                            {s.ideal}
                          </span>
                        </div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">À partir de</p>
                        <p className="text-xl font-extrabold text-sky-600 mb-4">{s.price}</p>
                        <div className="space-y-1.5">
                          {s.pros.map((p) => (
                            <div key={p} className="flex items-start gap-2 text-sm text-slate-600">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                              {p}
                            </div>
                          ))}
                          {s.cons.map((c) => (
                            <div key={c} className="flex items-start gap-2 text-sm text-slate-500">
                              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                              {c}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 2. Choisir */}
                <section id="choisir" className="mb-16 scroll-mt-24">
                  <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-semibold border border-sky-100 mb-4">
                    Chapitre 2
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                    Comment bien choisir sa climatisation ?
                  </h2>
                  <p className="text-slate-600 mb-8 leading-relaxed">
                    Quatre critères principaux doivent guider votre décision. Une étude technique gratuite avec nos experts vous permettra d'affiner le choix selon votre situation précise.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {criteria.map((c) => {
                      const Icon = c.icon;
                      return (
                        <div key={c.title} className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                          <div className="w-9 h-9 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center mb-3">
                            <Icon className="w-4 h-4 text-sky-600" />
                          </div>
                          <h3 className="font-semibold text-slate-900 mb-1.5">{c.title}</h3>
                          <p className="text-slate-500 text-sm leading-relaxed">{c.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                  {/* Encart conseil */}
                  <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 flex gap-4">
                    <Lightbulb className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-sky-900 mb-1">Notre conseil</p>
                      <p className="text-sky-800 text-sm leading-relaxed">
                        Ne choisissez pas votre climatisation uniquement sur le prix. Un système sous-dimensionné travaillera en continu et consommera plus. Notre étude thermique gratuite dimensionne précisément le système dont vous avez besoin.
                      </p>
                    </div>
                  </div>

                </section>

                {/* Calculateur de puissance */}
                <section id="calculateur" className="mb-16 scroll-mt-24">
                  <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-semibold border border-sky-100 mb-4">
                    Outil gratuit
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
                    Calculateur de puissance climatisation
                  </h2>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    Quelle puissance choisir pour votre appartement ou maison en Île-de-France ? Notre outil calcule la capacité idéale en kilowatts selon votre surface, votre isolation et l'exposition solaire de votre logement. Basé sur les normes thermiques françaises (35 à 60 W/m² selon l'isolation).
                  </p>
                  <Calculator />
                  <div className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-5">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      <strong className="text-slate-800">Comment interpréter ce résultat ?</strong>{" "}
                      La puissance calculée est une base de dimensionnement. Un technicien ClimExpert peut l'affiner lors d'une visite gratuite en tenant compte des charges thermiques propres à votre logement : matériel électronique, nombre d'occupants, ombrage réel et qualité précise des vitrages.
                    </p>
                  </div>
                </section>

                {/* 3. Prix */}
                <section id="prix" className="mb-16 scroll-mt-24">
                  <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-semibold border border-sky-100 mb-4">
                    Chapitre 3
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                    Combien coûte une climatisation en Île-de-France ?
                  </h2>
                  <p className="text-slate-600 mb-8 leading-relaxed">
                    Le prix d'une installation complète dépend du type de système, du nombre d'unités et des contraintes du chantier. Voici les fourchettes pratiquées en Île-de-France en 2025, pose et matériel inclus.
                  </p>

                  {/* Tableau */}
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 mb-8">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="text-left px-5 py-3 font-semibold text-slate-700">Système</th>
                          <th className="text-left px-5 py-3 font-semibold text-slate-700">Configuration</th>
                          <th className="text-left px-5 py-3 font-semibold text-slate-700">Prix TTC tout inclus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {[
                          ["Monosplit", "1 unité intérieure", "1 500 – 2 500 €"],
                          ["Multisplit 2 têtes", "2 unités intérieures", "2 800 – 4 500 €"],
                          ["Multisplit 3 têtes", "3 unités intérieures", "4 000 – 6 500 €"],
                          ["Gainable", "Toute la surface", "4 000 – 10 000 €"],
                          ["PAC air-eau", "Maison individuelle", "8 000 – 15 000 €"],
                        ].map(([sys, config, price]) => (
                          <tr key={sys} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-3.5 font-medium text-slate-900">{sys}</td>
                            <td className="px-5 py-3.5 text-slate-500">{config}</td>
                            <td className="px-5 py-3.5 font-bold text-sky-600">{price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-xs text-slate-400 mb-6">
                    Prix TTC, pose et mise en service inclus, pour les particuliers en Île-de-France.
                    Professionnels : ces tarifs s'entendent HT, la TVA (20%) est récupérable.
                  </p>

                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-4">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900 mb-1">Méfiez-vous des prix trop bas</p>
                      <p className="text-amber-800 text-sm leading-relaxed">
                        Une installation à moins de 800 € est souvent synonyme d'équipement bas de gamme, d'absence de certification ou de main-d'œuvre non qualifiée. Votre garantie et assurance habitation peuvent en être affectées.
                      </p>
                    </div>
                  </div>
                </section>

                {/* 4. Aides */}
                <section id="aides" className="mb-16 scroll-mt-24">
                  <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-semibold border border-sky-100 mb-4">
                    Chapitre 4
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                    Les aides financières disponibles
                  </h2>
                  <p className="text-slate-600 mb-8 leading-relaxed">
                    Plusieurs dispositifs permettent de réduire le coût de votre installation. L'éligibilité dépend du type de système et de vos revenus. Nos techniciens RGE vous permettent d'accéder à l'ensemble de ces aides.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4 mb-8">
                    {aids.map((a) => (
                      <div key={a.name} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                        <h3 className="font-bold text-slate-900 mb-1">{a.name}</h3>
                        <p className="text-xl font-extrabold text-emerald-600 mb-2">{a.amount}</p>
                        <p className="text-slate-500 text-sm">{a.condition}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-4">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <p className="text-emerald-800 text-sm leading-relaxed">
                      <strong>Nos techniciens RGE gèrent votre dossier d'aides de A à Z.</strong> Nous préparons les justificatifs nécessaires et vous aidons à maximiser le montant des subventions auxquelles vous avez droit.
                    </p>
                  </div>
                </section>

                {/* 5. Entretien */}
                <section id="entretien" className="mb-16 scroll-mt-24">
                  <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-semibold border border-sky-100 mb-4">
                    Chapitre 5
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                    L'entretien annuel : obligatoire et rentable
                  </h2>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    L'entretien annuel n'est pas qu'une obligation légale : c'est aussi le meilleur moyen de préserver les performances de votre installation et d'éviter les pannes coûteuses.
                  </p>
                  <div className="grid sm:grid-cols-3 gap-4 mb-8">
                    {[
                      { title: "Performances maintenues", desc: "Des filtres propres permettent d'économiser jusqu'à 30 % d'énergie." },
                      { title: "Durée de vie prolongée", desc: "Un appareil entretenu dure 15-20 ans. Sans entretien, 8-10 ans." },
                      { title: "Garantie préservée", desc: "L'absence d'entretien peut annuler la garantie fabricant." },
                    ].map((item) => (
                      <div key={item.title} className="bg-slate-50 border border-slate-100 rounded-2xl p-5 text-center">
                        <h3 className="font-semibold text-slate-900 mb-2 text-sm">{item.title}</h3>
                        <p className="text-slate-500 text-xs leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#0B1120] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Nos contrats d'entretien</p>
                      <p className="text-white font-bold text-xl">À partir de 180 € TTC <span className="text-slate-400 font-normal text-base">/ unité / an</span></p>
                      <p className="text-slate-400 text-sm">Tout inclus : déplacement, nettoyage, rapport</p>
                    </div>
                    <Link
                      href="/entretien"
                      className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl text-sm transition-colors"
                    >
                      Voir les contrats
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </section>

                {/* 6. Installation */}
                <section id="installation" className="mb-16 scroll-mt-24">
                  <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-semibold border border-sky-100 mb-4">
                    Chapitre 6
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                    Le déroulement d'une installation
                  </h2>
                  <p className="text-slate-600 mb-8 leading-relaxed">
                    De la demande de devis à la mise en service, voici comment se déroule une installation ClimExpert.
                  </p>
                  <div className="space-y-4">
                    {[
                      { num: "01", title: "Étude et devis gratuits", desc: "Visite technique (ou étude à distance) : nous analysons votre logement, vos besoins et vous remettons un devis détaillé sous 48h. Aucun frais, aucun engagement." },
                      { num: "02", title: "Choix du matériel", desc: "Nous vous guidons dans le choix de la marque et du modèle selon votre budget, la surface et vos préférences esthétiques. Daikin, Mitsubishi, Samsung, Toshiba…" },
                      { num: "03", title: "Pose professionnelle", desc: "Installation en 1 à 3 jours selon la configuration. Passages de gaines soignés, finitions propres, zéro nuisance permanente." },
                      { num: "04", title: "Mise en service et formation", desc: "Tests complets, réglages des températures, formation à l'utilisation. Vous repartez avec le certificat de conformité et tous les documents de garantie." },
                    ].map((step) => (
                      <div key={step.num} className="flex gap-5 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sky-500 text-white font-bold text-sm flex items-center justify-center">
                          {step.num}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 mb-1">{step.title}</h3>
                          <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <Link
                      href="/installation"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl text-sm transition-colors shadow-lg shadow-sky-500/20"
                    >
                      Voir la page installation
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <Link
                      href="/depannage"
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-sm transition-colors"
                    >
                      Dépannage urgent
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </section>

                {/* 7. FAQ */}
                <section id="faq" className="scroll-mt-24">
                  <span className="inline-block px-3 py-1 rounded-full bg-sky-50 text-sky-600 text-xs font-semibold border border-sky-100 mb-4">
                    Chapitre 7
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-8 tracking-tight">
                    Questions fréquentes
                  </h2>
                  <div className="space-y-3">
                    {faqItems.map((item, i) => (
                      <FaqItem key={i} question={item.question} answer={item.answer} />
                    ))}
                  </div>
                </section>
              </article>
            </div>
          </div>
        </section>

        {/* ── Articles SEO (bas de page) ── */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-4">
                Guides détaillés
              </span>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                Tous nos articles sur la climatisation en Île-de-France
              </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allArticles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/guide-climatisation/${article.slug}`}
                  className="group bg-white rounded-2xl border border-slate-100 overflow-hidden hover:border-sky-200 hover:shadow-lg transition-all duration-200"
                >
                  <div className="relative h-44 overflow-hidden">
                    <Image
                      src={article.heroImage}
                      alt={article.heroAlt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-sky-600 text-[10px] font-semibold uppercase tracking-wide">
                      {article.category}
                    </span>
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug mb-2 group-hover:text-sky-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-4">
                      {article.intro}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-slate-400 text-xs">
                        <Clock className="w-3 h-3" />{article.readTime} min de lecture
                      </span>
                      <span className="text-sky-500 text-xs font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                        Lire l&apos;article <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <PageCTA
          title="Prêt à passer à l'action ?"
          subtitle="Étude gratuite, devis sous 48h, installation par des techniciens RGE certifiés."
          ctaLabel="Obtenir mon devis gratuit"
        />
      </main>
      <Footer />
    </>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  "use client";
  return (
    <details className="bg-white border border-slate-100 rounded-2xl shadow-sm group">
      <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none">
        <span className="font-semibold text-slate-900 text-sm leading-snug">{question}</span>
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 group-open:bg-sky-500 flex items-center justify-center transition-colors">
          <span className="text-slate-500 group-open:text-white text-lg leading-none font-light transition-colors">+</span>
        </div>
      </summary>
      <p className="px-6 pb-5 text-slate-500 text-sm leading-relaxed">{answer}</p>
    </details>
  );
}
