import type { Metadata } from "next";

// Segment PRIVÉ (accès par jeton personnel) : jamais indexé par les moteurs de recherche.
// Ces pages contiennent des données personnelles de clients ; sans ce noindex elles héritent
// du layout racine qui autorise l'indexation.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function PrivateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
