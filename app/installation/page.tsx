import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageHero from "@/components/PageHero";
import FAQAccordion from "@/components/FAQAccordion";
import PageCTA from "@/components/PageCTA";

export const metadata: Metadata = {
  title: "Installation Climatisation Île-de-France | ClimExpert",
  description:
    "Installation de climatisation monosplit, multisplit, gainable et PAC en Île-de-France. Techniciens RGE certifiés. Devis gratuit, pose à partir de 1 500 €.",
  keywords:
    "installation climatisation ile-de-france, pose climatisation paris, installer clim appartement, prix installation climatisation, climatisation monosplit paris",
  alternates: {
    canonical: "https://climexpert.fr/installation",
  },
  openGraph: {
    title: "Installation Climatisation Île-de-France — ClimExpert",
    description:
      "Pose de climatisation par des techniciens RGE certifiés. Devis gratuit, à partir de 1 500 €.",
    url: "https://climexpert.fr/installation",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

const systems = [
  {
    name: "Monosplit",
    desc: "1 unité intérieure + 1 unité extérieure. Idéal pour climatiser une seule pièce. La solution la plus répandue pour les appartements.",
    price: "À partir de 1 500 €",
    best: "Appartements, studios",
  },
  {
    name: "Multisplit",
    desc: "Plusieurs unités intérieures reliées à une seule unité extérieure. Parfait pour climatiser plusieurs pièces avec un seul compresseur.",
    price: "À partir de 2 800 €",
    best: "Maisons, grands appartements",
  },
  {
    name: "Gainable",
    desc: "Système intégré dans les faux-plafonds, totalement invisible. La solution premium pour un résultat discret et une diffusion homogène.",
    price: "À partir de 4 000 €",
    best: "Maisons, locaux pro",
  },
  {
    name: "PAC air-eau",
    desc: "Pompe à chaleur qui produit chauffage et eau chaude sanitaire. Solution tout-en-un très économe, éligible aux aides MaPrimeRénov'.",
    price: "Sur devis",
    best: "Maisons individuelles",
  },
];

const steps = [
  {
    num: "01",
    title: "Étude gratuite",
    desc: "Visite technique ou étude à distance : surface, isolation, exposition, contraintes esthétiques.",
  },
  {
    num: "02",
    title: "Devis détaillé",
    desc: "Proposition chiffrée avec le matériel, la pose et les aides financières disponibles.",
  },
  {
    num: "03",
    title: "Installation",
    desc: "Pose par nos techniciens certifiés. Passages de gaines soignés, finitions irréprochables.",
  },
  {
    num: "04",
    title: "Mise en service",
    desc: "Tests complets, réglages, formation à l'utilisation et remise du certificat de conformité.",
  },
];

const faqItems = [
  {
    question: "Quel est le prix d'une installation de climatisation en Île-de-France ?",
    answer:
      "Le prix d'une installation dépend du type de système et du nombre d'unités. Comptez à partir de 1 500 € pour un monosplit (1 pièce), entre 2 800 € et 5 000 € pour un multisplit (2-3 pièces), et à partir de 4 000 € pour un système gainable. Ces prix incluent le matériel et la main-d'œuvre.",
  },
  {
    question: "Combien de temps dure une installation ?",
    answer:
      "Une installation monosplit prend généralement une journée. Un multisplit 2-3 têtes nécessite 1 à 2 jours. Un système gainable peut demander 2 à 4 jours selon la surface. Nous organisons le chantier pour minimiser la gêne.",
  },
  {
    question: "Faut-il une autorisation pour installer une climatisation ?",
    answer:
      "Pour un logement en copropriété, l'accord du syndic est nécessaire pour poser une unité extérieure en façade. En maison individuelle, aucune autorisation n'est requise en général. Dans les zones classées, des restrictions peuvent s'appliquer. Nous vous accompagnons dans ces démarches.",
  },
  {
    question: "Quelles marques proposez-vous ?",
    answer:
      "Nous installons les principales marques du marché : Daikin, Mitsubishi Electric, Samsung, Toshiba, LG, Fujitsu, Atlantic et Panasonic. Nous vous conseillons selon votre budget et vos besoins spécifiques.",
  },
  {
    question: "Y a-t-il des aides financières pour l'installation ?",
    answer:
      "Oui. Les pompes à chaleur air-eau sont éligibles à MaPrimeRénov' et aux Certificats d'Économies d'Énergie (CEE). Pour les climatiseurs réversibles, des aides locales peuvent exister. Notre équipe gère le montage de votre dossier d'aides.",
  },
  {
    question: "La climatisation peut-elle aussi chauffer ?",
    answer:
      "Oui, tous les systèmes que nous installons sont réversibles : ils climatisent en été et chauffent en hiver avec un COP (coefficient de performance) de 3 à 5, ce qui les rend 3 à 5 fois plus économiques qu'un chauffage électrique classique.",
  },
  {
    question: "Quelle est la durée de garantie ?",
    answer:
      "Nos installations bénéficient de la garantie fabricant (2 à 5 ans selon les marques) ainsi que de notre garantie main-d'œuvre de 2 ans. Nous proposons également des contrats d'entretien pour prolonger la durée de vie de votre installation.",
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
  name: "Installation de climatisation en Île-de-France",
  serviceType: "Installation climatisation",
  description: "Installation de systèmes de climatisation monosplit, multisplit, gainable et PAC air-eau en Île-de-France par des techniciens RGE certifiés.",
  provider: { "@type": "LocalBusiness", "@id": "https://climexpert.fr", name: "ClimExpert" },
  areaServed: { "@type": "AdministrativeArea", name: "Île-de-France" },
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: "1500",
    highPrice: "15000",
    offerCount: "4",
    offers: [
      { "@type": "Offer", name: "Monosplit", price: "1500", priceCurrency: "EUR" },
      { "@type": "Offer", name: "Multisplit", price: "2800", priceCurrency: "EUR" },
      { "@type": "Offer", name: "Gainable", price: "4000", priceCurrency: "EUR" },
      { "@type": "Offer", name: "PAC air-eau", price: "8000", priceCurrency: "EUR" },
    ],
  },
  url: "https://climexpert.fr/installation",
};

export default function InstallationPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <Header />
      <main>
        <PageHero
          badge="Techniciens RGE — Île-de-France"
          title="Installation climatisation"
          titleAccent="sur mesure"
          subtitle="Monosplit, multisplit, gainable, PAC air-air et air-eau. Étude gratuite, devis transparent, installation soignée par des techniciens certifiés RGE."
          ctaLabel="Devis gratuit"
          photo="/images/services-installation.jpg"
          photoAlt="Installation climatisation Île-de-France"
          topic="Installation"
          stats={[
            { value: "80+", label: "Installations" },
            { value: "10 ans", label: "Exp. cumulée" },
            { value: "Certifiés", label: "Fluides F-Gaz" },
            { value: "1 500 €", label: "À partir de" },
          ]}
        />

        {/* Types de systèmes */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-4">
                Nos solutions
              </span>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight mb-3">
                Quel système pour votre projet ?
              </h2>
              <p className="text-slate-500 max-w-xl mx-auto">
                Nous étudions votre situation et vous recommandons la solution la plus adaptée à votre logement et votre budget.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {systems.map((s) => (
                <div
                  key={s.name}
                  className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-sky-200 transition-all duration-200"
                >
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{s.name}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-4">{s.desc}</p>
                  <div className="pt-4 border-t border-slate-100">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mb-1">À partir de</p>
                    <p className="text-xl font-extrabold text-sky-600">{s.price.replace("À partir de ", "")}</p>
                    <p className="text-xs text-slate-400 mt-1">Idéal : {s.best}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Processus */}
        <section className="py-20 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-4">
                  Notre processus
                </span>
                <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                  De la demande à la mise en service
                </h2>
                <p className="text-slate-500 mb-8">
                  Un accompagnement complet, de l'étude initiale jusqu'à la formation à l'utilisation de votre nouvel équipement.
                </p>
                <div className="space-y-6">
                  {steps.map((step) => (
                    <div key={step.num} className="flex gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-sky-500 text-white font-bold text-sm flex items-center justify-center">
                        {step.num}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-1">{step.title}</h3>
                        <p className="text-slate-500 text-sm">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative rounded-3xl overflow-hidden aspect-[4/3] shadow-xl">
                <Image
                  src="/images/services-installation.jpg"
                  alt="Technicien installation climatisation"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Inclus */}
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-sky-50 text-sky-600 text-sm font-medium border border-sky-100 mb-4">
              Ce qui est inclus
            </span>
            <h2 className="text-3xl font-bold text-slate-900 mb-10 tracking-tight">
              Tout compris dans votre devis
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 text-left">
              {[
                "Déplacement et étude technique sur site",
                "Fourniture et pose de l'unité intérieure et extérieure",
                "Passage et habillage des liaisons frigorifiques",
                "Connexion électrique et mise en service complète",
                "Test d'étanchéité et remplissage en frigorigène",
                "Formation à l'utilisation et remise de la documentation",
                "Certificat de conformité et attestation RGE",
                "Garantie main-d'œuvre 2 ans",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <CheckCircle2 className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FAQAccordion
          title="Questions sur l'installation de climatisation"
          items={faqItems}
        />

        <PageCTA
          title="Obtenez votre devis d'installation"
          subtitle="Réponse sous 24h. Étude gratuite et sans engagement."
          ctaLabel="Demander un devis gratuit"
          topic="Installation"
        />
      </main>
      <Footer />
    </>
  );
}
