import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devis Climatisation Gratuit Île-de-France",
  description:
    "Demandez un devis gratuit pour votre projet de climatisation en Île-de-France. Installation, entretien, dépannage par des techniciens RGE certifiés. Réponse sous 24h.",
  keywords:
    "devis climatisation gratuit, devis installation clim ile-de-france, devis entretien climatisation paris, demande devis clim",
  alternates: { canonical: "https://climexpert.fr/devis" },
  openGraph: {
    title: "Devis Climatisation Gratuit — ClimExpert Île-de-France",
    description:
      "Obtenez votre devis gratuit en 2 minutes. Installation, entretien, dépannage par des techniciens RGE certifiés.",
    url: "https://climexpert.fr/devis",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

import DevisClient from "./DevisClient";

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://climexpert.fr" },
    { "@type": "ListItem", position: 2, name: "Devis gratuit", item: "https://climexpert.fr/devis" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Est-ce que le devis est vraiment gratuit ?",
      acceptedAnswer: { "@type": "Answer", text: "Oui, le devis est 100% gratuit et sans engagement. Nous vous envoyons une proposition détaillée sous 24h après étude de votre projet." },
    },
    {
      "@type": "Question",
      name: "Dans quel délai recevez-vous le devis ?",
      acceptedAnswer: { "@type": "Answer", text: "Vous recevez votre devis sous 24h ouvrées. Pour les projets complexes (gainable, PAC), une visite technique gratuite peut être proposée avant chiffrage." },
    },
    {
      "@type": "Question",
      name: "Quelles zones géographiques couvrez-vous ?",
      acceptedAnswer: { "@type": "Answer", text: "ClimExpert intervient dans toute l'Île-de-France : Paris, Hauts-de-Seine, Val-de-Marne, Seine-Saint-Denis, Yvelines, Essonne, Seine-et-Marne et Val-d'Oise." },
    },
    {
      "@type": "Question",
      name: "Puis-je joindre des photos à ma demande de devis ?",
      acceptedAnswer: { "@type": "Answer", text: "Oui, vous pouvez ajouter jusqu'à 5 photos (pièce à climatiser, emplacement envisagé, tableau électrique…). Cela permet un chiffrage plus précis sans déplacement préalable." },
    },
    {
      "@type": "Question",
      name: "Le devis inclut-il les aides financières disponibles ?",
      acceptedAnswer: { "@type": "Answer", text: "Oui, notre devis détaille toutes les aides applicables à votre projet : MaPrimeRénov', CEE, éco-prêt à taux zéro. Nos techniciens RGE vous permettent d'y accéder directement." },
    },
  ],
};

const serviceSchema = {
  "@context": "https://schema.org",
  "@type": "Service",
  name: "Devis climatisation gratuit Île-de-France",
  serviceType: "Devis installation climatisation",
  description: "Obtenez un devis gratuit et sans engagement pour votre installation, entretien ou dépannage de climatisation en Île-de-France. Réponse sous 24h par des techniciens RGE certifiés.",
  provider: {
    "@type": "HVACBusiness",
    "@id": "https://climexpert.fr",
    name: "ClimExpert",
    telephone: "+33667432767",
  },
  areaServed: { "@type": "AdministrativeArea", name: "Île-de-France" },
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "EUR",
    description: "Devis gratuit et sans engagement — réponse sous 24h",
  },
  url: "https://climexpert.fr/devis",
};

export default function DevisPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <DevisClient />
    </>
  );
}
