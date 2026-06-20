import type { Viewport } from "next";

// Désactive le zoom (pinch) uniquement sur l'espace admin, pour un ressenti
// « application ». Le site public conserve le zoom (accessibilité / SEO).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
