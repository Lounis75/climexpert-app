import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devis Climatisation Gratuit Île-de-France — ClimExpert",
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

export default function DevisPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <DevisClient />
    </>
  );
}
