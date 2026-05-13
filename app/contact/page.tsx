import type { Metadata } from "next";
import ContactClient from "./ContactClient";

export const metadata: Metadata = {
  title: "Contact ClimExpert — Devis Gratuit, Dépannage, Entretien | Île-de-France",
  description:
    "Contactez ClimExpert pour une installation, un entretien ou un dépannage de climatisation en Île-de-France. Réponse sous 2h, devis gratuit sans engagement.",
  keywords:
    "contact climexpert, devis climatisation ile-de-france, demande installation clim, urgence dépannage climatisation paris",
  alternates: { canonical: "https://climexpert.fr/contact" },
  openGraph: {
    title: "Contact ClimExpert — Devis Gratuit Île-de-France",
    description:
      "Demandez un devis gratuit ou signalez une panne. Réponse sous 2h, techniciens certifiés en Île-de-France.",
    url: "https://climexpert.fr/contact",
    images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
  },
};

export default function ContactPage() {
  return <ContactClient />;
}
