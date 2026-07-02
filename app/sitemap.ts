import { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
import { getPublishedDynamicArticles } from "@/lib/dynamicArticles";
import { VILLES } from "@/lib/villes";
import { DEPARTEMENTS } from "@/lib/departements";

const BASE = "https://climexpert.fr";

// Date de dernière vraie mise à jour éditoriale des pages statiques. À bumper quand le contenu
// marketing change réellement. Un lastModified = new Date() à chaque génération rendait le
// signal inutilisable (Google apprend à l'ignorer si "tout change tous les jours").
const CONTENT_UPDATED = new Date("2026-07-01");

function page(path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly"): MetadataRoute.Sitemap[number] {
  return { url: `${BASE}${path}`, lastModified: CONTENT_UPDATED, changeFrequency, priority };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamicArticles = await getPublishedDynamicArticles();
  const dynamicSlugs = new Set(dynamicArticles.map((a) => a.slug));

  const staticArticleEntries: MetadataRoute.Sitemap = articles
    .filter((a) => !dynamicSlugs.has(a.slug))
    .map((article) => ({
      url: `${BASE}/guide-climatisation/${article.slug}`,
      lastModified: new Date(article.date),
      changeFrequency: "monthly",
      priority: 0.75,
    }));

  const dynamicArticleEntries: MetadataRoute.Sitemap = dynamicArticles.map((article) => ({
    url: `${BASE}/guide-climatisation/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "monthly",
    priority: 0.75,
  }));

  return [
    { url: BASE, lastModified: CONTENT_UPDATED, changeFrequency: "weekly", priority: 1 },
    page("/installation", 0.9),
    page("/entretien", 0.9),
    page("/depannage", 0.9),
    page("/tarifs", 0.85),
    page("/calculateur", 0.8),
    page("/guide-climatisation", 0.85, "weekly"),
    page("/devis", 0.8),
    page("/qui-sommes-nous", 0.7),
    page("/recrutement", 0.7, "weekly"),
    page("/rse", 0.6, "yearly"),
    page("/avis", 0.7),
    page("/contact", 0.6, "yearly"),
    page("/departements", 0.7),
    page("/villes", 0.7),
    ...DEPARTEMENTS.map((d) => page(`/departements/${d.slug}`, 0.8)),
    ...VILLES.map((v) => page(`/villes/${v.slug}`, 0.8)),
    ...staticArticleEntries,
    ...dynamicArticleEntries,
  ];
}
