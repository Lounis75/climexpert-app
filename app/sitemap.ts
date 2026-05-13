import { MetadataRoute } from "next";
import { articles } from "@/lib/articles";
import { getDynamicArticles } from "@/lib/dynamicArticles";

const BASE = "https://climexpert.fr";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dynamicArticles = await getDynamicArticles();
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
    {
      url: BASE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE}/installation`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/entretien`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/depannage`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${BASE}/guide-climatisation`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${BASE}/devis`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE}/contact`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.6,
    },
    ...staticArticleEntries,
    ...dynamicArticleEntries,
  ];
}
