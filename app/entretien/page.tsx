import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import FAQAccordion from "@/components/FAQAccordion";
import PageCTA from "@/components/PageCTA";

export const metadata: Metadata = {
  title: "Entretien Climatisation Île-de-France | ClimExpert — à partir de 180 € TTC",
  description:
    "Contrat d'entretien climatisation en Île-de-France. Nettoyage, contrôle frigorigène, rapport d'intervention. à partir de 180 € TTC / unité / an. Techniciens RGE certifiés.",
  keywords:
    "entretien climatisation ile-de-france, maintenance climatisation paris, contrat entretien clim, nettoyage climatisation, révision climatisation obligatoire",
  alternates: {
    canonical: "https://climexpert.fr/entretien",
  },
  openGraph: {
    title: "Entretien & Maintenance Climatisation — ClimExpert",
    description:
      "Contrat d'entretien annuel à partir de 180 € TTC (Paris intramuros) +60 € TTC/unité supplémentaire. Nettoyage, contrôle frigorigène, rapport complet.",
    url: "https://climexpert.fr/entretien",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

const included = [
  "Nettoyage des filtres et de l'évaporateur intérieur",
  "Nettoyage du condenseur extérieur",
  "Vérification et contrôle du niveau de frigorigène",
  "Contrôle des pressions de service",
  "Vérification des connexions électriques",
  "Test des modes de fonctionnement (froid/chaud)",
  "Contrôle du drain et de l'évacuation des condensats",
  "Rapport d'intervention détaillé et signé",
];

const risks = [
  {
    title: "Performances dégradées",
    desc: "Des filtres encrassés peuvent réduire l'efficacité jusqu'à 30 %, entraînant une hausse de votre facture d'électricité.",
  },
  {
    title: "Risque sanitaire",
    desc: "L'accumulation de moisissures et de bactéries dans les unités non entretenues peut être nocive pour la santé.",
  },
  {
    title: "Obligation légale",
    desc: "L'entretien des systèmes contenant plus de 2 kg de fluide frigorigène est obligatoire selon la réglementation F-Gaz.",
  },
  {
    title: "Garantie annulée",
    desc: "L'absence d'entretien peut annuler la garantie fabricant en cas de panne. Un contrat protège votre investissement.",
  },
];

const faqItems = [
  {
    question: "L'entretien de la climatisation est-il obligatoire ?",
    answer:
      "Oui, partiellement. Pour les systèmes contenant 2 kg ou plus de fluide frigorigène, l'entretien par un technicien certifié est obligatoire selon la réglementation européenne F-Gaz. Même sous ce seuil, un entretien annuel est fortement recommandé pour maintenir les performances et la garantie fabricant.",
  },
  {
    question: "À quelle fréquence faut-il faire entretenir sa climatisation ?",
    answer:
      "Un entretien annuel est la norme recommandée. Idéalement, il se fait au printemps avant la saison chaude. Pour les locaux professionnels ou les systèmes très sollicités, deux visites par an (printemps et automne) sont conseillées.",
  },
  {
    question: "Quel est le tarif d'un entretien de climatisation ?",
    answer:
      "Nos contrats d'entretien débutent à 180 € TTC pour 1 unité à Paris intramuros. Chaque unité supplémentaire est facturée 50 €. Une majoration s'applique selon la distance et l'accessibilité de l'installation (hauteur, encombrement). Tout est inclus : déplacement, main-d'œuvre, nettoyage et rapport d'intervention.",
  },
  {
    question: "Que se passe-t-il si le niveau de frigorigène est bas ?",
    answer:
      "Si nous détectons une baisse de niveau lors de l'entretien, cela signifie qu'il y a une fuite. Nous effectuons un test d'étanchéité, localisons la fuite et établissons un devis de réparation. La recharge seule sans recherche de fuite n'est pas une solution pérenne.",
  },
  {
    question: "Intervenez-vous sur toutes les marques ?",
    answer:
      "Oui. Nos techniciens sont formés sur toutes les marques : Daikin, Mitsubishi, Samsung, Toshiba, LG, Fujitsu, Atlantic, Panasonic, Carrier et bien d'autres. L'entretien est indépendant de la marque de votre équipement.",
  },
  {
    question: "Proposez-vous des contrats multi-sites pour les professionnels ?",
    answer:
      "Oui, c'est l'un de nos points forts. Nous gérons des contrats de maintenance pour des syndics de copropriété, des gestionnaires immobiliers et des entreprises avec plusieurs sites en Île-de-France. Les interventions sont planifiées pour minimiser les dérangements.",
  },
];

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Entretien et maintenance de climatisation en Île-de-France",
  serviceType: "Maintenance climatisation",
  description: "Contrat d'entretien annuel de climatisation à partir de 180 € TTC en Île-de-France (Paris intramuros), +60 € TTC/unité supplémentaire. Nettoyage complet, contrôle frigorigène obligatoire F-Gaz, rapport d'intervention par des techniciens RGE certifiés.",
  provider: { "@type": "LocalBusiness", "@id": "https://climexpert.fr", name: "ClimExpert" },
  areaServed: { "@type": "AdministrativeArea", name: "Île-de-France" },
  offers: {
    "@type": "Offer",
    name: "Contrat entretien annuel",
    price: "200",
    priceCurrency: "EUR",
    description: "Par unité et par an, tout inclus : déplacement, nettoyage, rapport d'intervention.",
  },
  url: "https://climexpert.fr/entretien",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Accueil", "item": "https://climexpert.fr" },
    { "@type": "ListItem", "position": 2, "name": "Entretien climatisation", "item": "https://climexpert.fr/entretien" },
  ],
};

export default function EntretienPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <Header />
      <main>
        <PageHero
          badge="Maintenance certifiée RGE — Île-de-France"
          title="Entretien & maintenance"
          titleAccent="de climatisation"
          subtitle="À partir de 180 € TTC pour 1 unité à Paris intramuros, +60 € TTC par unité supplémentaire, tout inclus. Nettoyage complet, contrôle frigorigène et rapport d'intervention détaillé par des techniciens certifiés."
          ctaLabel="Souscrire un contrat"
          photo="/images/services-maintenance.jpg"
          photoAlt="Entretien climatisation Île-de-France"
          topic="Entretien"
          stats={[
            { value: "180 €", label: "À partir de / an (TTC)" },
            { value: "2×/an", label: "Option pro" },
            { value: "Toutes", label: "Marques" },
            { value: "48h", label: "Prise en charge" },
          ]}
        />

        {/* Ce qui est inclus */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-sm font-medium border border-emerald-100 mb-4">
                  Contenu de la prestation
                </span>
                <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                  Ce que comprend
                  <br />votre contrat d'entretien
                </h2>
                <p className="text-slate-500 mb-8">
                  Chaque visite suit un protocole rigoureux de 8 points de contrôle,
                  documenté dans un rapport remis en fin d'intervention.
                </p>
                <ul className="space-y-3">
                  {included.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-700 text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-xl">
                <Image
                  src="/images/services-maintenance.jpg"
                  alt="Technicien entretien climatisation"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Pourquoi entretenir */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-amber-50 text-amber-600 text-sm font-medium border border-amber-100 mb-4">
                Pourquoi c'est important
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
                Les risques d'un manque d'entretien
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Négliger l'entretien de votre climatisation, c'est prendre des risques sur plusieurs plans.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {risks.map((r) => (
                <div key={r.title} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex gap-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1">{r.title}</h3>
                    <p className="text-slate-500 text-sm">{r.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Prix mis en avant */}
            <div className="mt-10 bg-[#0B1120] rounded-3xl p-8 lg:p-12 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Contrat annuel</p>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-extrabold text-emerald-400">180 €<span className="text-xl font-semibold ml-1.5 opacity-60">TTC</span></span>
                  <span className="text-slate-400 text-lg">/ 1ère unité</span>
                </div>
                <p className="text-slate-400 text-sm mt-1">+60 € TTC/unité supplémentaire · Paris intramuros · Majoration selon distance et accessibilité</p>
              </div>
              <a
                href="#devis"
                className="flex-shrink-0 inline-flex items-center gap-2 px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-emerald-500/25 whitespace-nowrap"
              >
                Souscrire un contrat
              </a>
            </div>
          </div>
        </section>

        <FAQAccordion
          title="Questions sur l'entretien de climatisation"
          items={faqItems}
        />

        <PageCTA
          title="Protégez votre climatisation"
          subtitle="À partir de 180 € TTC / unité (Paris intramuros). Techniciens disponibles sous 48h."
          ctaLabel="Souscrire un contrat"
          topic="Entretien"
        />
      </main>
      <Footer />
    </>
  );
}
