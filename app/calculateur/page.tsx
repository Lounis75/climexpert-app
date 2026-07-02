import type { Metadata } from "next";
import CalculateurClient from "./CalculateurClient";

export const metadata: Metadata = {
  title: "Calculateur Climatisation Île-de-France, Estimation Gratuite",
  description:
    "Calculez la puissance et le prix de votre climatisation en 2 minutes. Monosplit, multisplit, gainable, estimation personnalisée selon votre logement. Devis gratuit sous 24h.",
  keywords:
    "calculateur climatisation, calculer puissance climatisation, estimer prix climatisation ile-de-france, combien coûte climatisation, simulation climatisation paris",
  alternates: {
    canonical: "https://climexpert.fr/calculateur",
  },
  openGraph: {
    title: "Calculateur Climatisation, Estimation Gratuite en 2 min | ClimExpert",
    description:
      "Calculez la puissance et le budget pour votre projet. Résultat instantané, devis gratuit sous 24h.",
    url: "https://climexpert.fr/calculateur",
    siteName: "ClimExpert",
    locale: "fr_FR",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Comment calculer la puissance d'une climatisation ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "La puissance se calcule selon la surface (en m²), la hauteur sous plafond, l'isolation et l'exposition solaire. Pour une pièce standard de 20 m² bien isolée, comptez 0,7 à 1 kW. Notre calculateur applique les normes thermiques françaises (35-60 W/m²). Règle générale : 35 W/m² pour un logement bien isolé, 45 W/m² pour une isolation moyenne, 60 W/m² pour un logement mal isolé.",
      },
    },
    {
      "@type": "Question",
      name: "Quel est le prix d'une climatisation en Île-de-France ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "À partir de 3 000 € TTC pour un monosplit (1 pièce), 5 000 – 10 000 € pour un multisplit (2-3 pièces), et 7 000 – 15 000 € pour un système gainable. Ces prix incluent le matériel et la pose par des techniciens RGE certifiés. La pose seule représente environ 30 à 40 % du prix total.",
      },
    },
    {
      "@type": "Question",
      name: "Monosplit ou multisplit : quelle solution choisir ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le monosplit (1 unité intérieure) est idéal pour une seule pièce, salon, chambre ou bureau, à partir de 3 000 €. Le multisplit (2 à 6 unités intérieures sur une seule unité extérieure) convient aux logements multi-pièces et revient moins cher par pièce à partir de 2 unités, à partir de 5 000 €. Pour une maison entière, un système gainable ou une PAC air-air peut être plus adapté.",
      },
    },
    {
      "@type": "Question",
      name: "La climatisation réversible peut-elle chauffer en hiver ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, tous les systèmes que nous installons sont réversibles. En mode chauffage, une climatisation réversible est 3 à 5 fois plus efficace qu'un radiateur électrique classique. Elle fonctionne jusqu'à -15°C pour les modèles récents. C'est un excellent complément ou remplacement de chauffage dans les logements bien isolés.",
      },
    },
    {
      "@type": "Question",
      name: "Faut-il une autorisation pour installer une climatisation ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Pour une maison individuelle, aucune autorisation n'est généralement requise si l'unité extérieure n'est pas visible depuis la rue. En copropriété, l'accord de l'assemblée générale est souvent nécessaire pour poser une unité en façade. En zone ABF (Architecte des Bâtiments de France) ou dans certains secteurs parisiens, une déclaration préalable de travaux peut être obligatoire.",
      },
    },
    {
      "@type": "Question",
      name: "Combien de temps prend l'installation d'une climatisation ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Une installation monosplit prend généralement une journée. Un multisplit 2-3 têtes nécessite 1 à 2 jours. Nos techniciens interviennent sous 48h après signature du devis.",
      },
    },
    {
      "@type": "Question",
      name: "Y a-t-il des aides pour financer ma climatisation ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Les pompes à chaleur air-eau sont éligibles à MaPrimeRénov' (jusqu'à 4 000 €) et aux CEE (200 – 800 €). Pour les climatiseurs réversibles, des aides locales peuvent s'appliquer selon votre département. Nos techniciens RGE gèrent les dossiers de A à Z.",
      },
    },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Estimation et installation climatisation Île-de-France",
  serviceType: "Installation climatisation",
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
    lowPrice: "1500",
    highPrice: "15000",
  },
  url: "https://climexpert.fr/calculateur",
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://climexpert.fr" },
    { "@type": "ListItem", position: 2, name: "Calculateur climatisation", item: "https://climexpert.fr/calculateur" },
  ],
};

export default function CalculateurPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <CalculateurClient />
    </>
  );
}
