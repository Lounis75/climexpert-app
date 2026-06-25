import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // pdfkit charge ses polices (.afm) depuis node_modules au runtime → le garder externe
  // (non bundlé) pour que la génération PDF du contrat fonctionne en serverless.
  serverExternalPackages: ["pdfkit"],
  // Embarque le PDF officiel du CERFA dans les fonctions qui le remplissent (pdf-lib).
  outputFileTracingIncludes: {
    "/api/admin/cerfa-preview": ["./lib/cerfa-template-15497-04.pdf"],
    "/api/technicien/rapports": ["./lib/cerfa-template-15497-04.pdf"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      { protocol: "https", hostname: "*.r2.dev" },           // images uploadées (Cloudflare R2 public)
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
    // Moins de variantes générées par image (défaut Next = 8 deviceSizes). On garde les 4
    // points de rupture utiles (mobile / tablette / desktop / large) : divise par 2 le nombre
    // de transformations facturées sur Vercel, sans perte visible (le hero 4K est inutile).
    deviceSizes: [640, 828, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
