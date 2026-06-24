import type { Metadata, Viewport } from "next";

// Manifest DÉDIÉ à l'admin : display=standalone + start_url=/admin. C'est lui qui, sur iOS
// récent, déclenche le mode plein écran « app » (stockage persistant → session qui tient) et
// fait que l'icône s'ouvre sur /admin. Le manifest /manifest.json reste réservé au technicien.
export const metadata: Metadata = {
  manifest: "/manifest-admin.json",
  appleWebApp: { capable: true, title: "ClimExpert", statusBarStyle: "default" },
};

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
