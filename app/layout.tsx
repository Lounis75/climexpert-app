import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ChatBotLoader from "@/components/ChatBotLoader";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const BASE = "https://climexpert.fr";

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: "ClimExpert — Climatisation Île-de-France | Installation & Entretien",
    template: "%s | ClimExpert",
  },
  description:
    "Expert en installation, entretien et dépannage de climatisation en Île-de-France. Techniciens RGE certifiés. Devis gratuit en 2 minutes.",
  keywords:
    "climatisation ile-de-france, installation climatisation, entretien climatisation, dépannage clim paris",
  alternates: {
    canonical: BASE,
  },
  openGraph: {
    title: "ClimExpert — Climatisation Île-de-France",
    description:
      "Installation, entretien et dépannage climatisation. Techniciens RGE certifiés. Devis gratuit.",
    url: BASE,
    siteName: "ClimExpert",
    locale: "fr_FR",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "ClimExpert — Climatisation Île-de-France",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ClimExpert — Climatisation Île-de-France",
    description: "Installation, entretien et dépannage climatisation. Techniciens RGE certifiés.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: "/icon-192.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  verification: {
    google: "UQ6FVXfNlnuKM--mWCVdcvXjlG0LC_dJFJf_4-H8MEU",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "HVACBusiness",
  "@id": BASE,
  name: "ClimExpert",
  description:
    "Expert en installation, entretien et dépannage de climatisation en Île-de-France. Techniciens RGE certifiés.",
  url: BASE,
  telephone: "+33667432767",
  email: "contact@climexpert.fr",
  priceRange: "€€",
  currenciesAccepted: "EUR",
  paymentAccepted: "Carte bancaire, Virement bancaire, Chèque",
  areaServed: {
    "@type": "AdministrativeArea",
    name: "Île-de-France",
  },
  address: {
    "@type": "PostalAddress",
    addressRegion: "Île-de-France",
    addressCountry: "FR",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 48.8566,
    longitude: 2.3522,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday",
    ],
    opens: "07:00",
    closes: "20:00",
  },
  sameAs: [
    // Ajouter ici les URLs réseaux sociaux quand disponibles
    // "https://www.facebook.com/climexpert",
    // "https://www.instagram.com/climexpert",
  ],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Services climatisation",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Installation de climatisation",
          url: `${BASE}/installation`,
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Entretien et maintenance climatisation",
          url: `${BASE}/entretien`,
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Dépannage climatisation",
          url: `${BASE}/depannage`,
        },
      },
    ],
  },
  image: {
    "@type": "ImageObject",
    url: `${BASE}/logo.svg`,
    width: 240,
    height: 60,
  },
  logo: {
    "@type": "ImageObject",
    url: `${BASE}/logo.svg`,
    width: 240,
    height: 60,
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    reviewCount: "200",
    bestRating: "5",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${inter.variable} h-full antialiased`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <ChatBotLoader />
      </body>
    </html>
  );
}
