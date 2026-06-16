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

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Accueil", item: "https://climexpert.fr" },
    { "@type": "ListItem", position: 2, name: "Contact", item: "https://climexpert.fr/contact" },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Quel est le délai de réponse après une prise de contact ?",
      acceptedAnswer: { "@type": "Answer", text: "Nous répondons à toutes les demandes sous 2h en heures ouvrées (7h-20h, 7j/7). Pour les urgences de dépannage, un technicien peut intervenir sous 48h." },
    },
    {
      "@type": "Question",
      name: "Comment puis-je joindre ClimExpert en urgence ?",
      acceptedAnswer: { "@type": "Answer", text: "Pour une urgence, appelez directement le 06 67 43 27 67 ou écrivez via WhatsApp. Notre équipe est disponible 7j/7 de 7h à 20h." },
    },
    {
      "@type": "Question",
      name: "Intervenez-vous pour toutes les marques de climatisation ?",
      acceptedAnswer: { "@type": "Answer", text: "Oui, nos techniciens sont formés sur toutes les marques : Daikin, Mitsubishi Electric, Samsung, Toshiba, LG, Fujitsu, Atlantic, Panasonic et bien d'autres." },
    },
    {
      "@type": "Question",
      name: "Proposez-vous des contrats d'entretien pour les professionnels ?",
      acceptedAnswer: { "@type": "Answer", text: "Oui, nous proposons des contrats d'entretien annuels adaptés aux locaux professionnels, hôtels, restaurants et copropriétés. Contactez-nous pour un devis sur mesure." },
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <ContactClient />
    </>
  );
}
