import type { NextConfig } from "next";

// Content-Security-Policy. `script-src`/`style-src` autorisent 'unsafe-inline' car Next (hydratation)
// et nos JSON-LD sont des scripts/styles inline (le nonce imposerait un middleware sur TOUTES les
// routes, qu'on a justement retiré du site public pour la perf). Le vrai gain ici : bloquer les
// scripts EXTERNES injectés, l'inclusion en iframe (clickjacking), les plugins, et le détournement
// de <base>. Images : notre R2 + Unsplash + data/blob (signatures, aperçus).
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://*.r2.dev https://*.r2.cloudflarestorage.com https://images.unsplash.com https://*.public.blob.vercel-storage.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'",
  "connect-src 'self' https:",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
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
