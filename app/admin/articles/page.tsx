import { articles } from "@/lib/articles";
import { getFeaturedSlugs } from "@/lib/kv";
import { getDynamicArticles } from "@/lib/dynamicArticles";
import AdminHeader from "@/components/AdminHeader";
import ArticlesManager from "./ArticlesManager";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const [featuredSlugs, dynamicArticles] = await Promise.all([
    getFeaturedSlugs(),
    getDynamicArticles(),
  ]);

  const dynamicSlugs = new Set(dynamicArticles.map((a) => a.slug));

  const rows = [
    // Articles dynamiques (créés dans le backoffice)
    ...dynamicArticles.map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      date: a.date,
      readTime: a.readTime,
      featured: featuredSlugs.includes(a.slug),
      isDynamic: true,
    })),
    // Articles statiques (non remplacés par un article dynamique)
    ...articles
      .filter((a) => !dynamicSlugs.has(a.slug))
      .map((a) => ({
        slug: a.slug,
        title: a.title,
        category: a.category,
        date: a.date,
        readTime: a.readTime,
        featured: featuredSlugs.includes(a.slug),
        isDynamic: false,
      })),
  ];

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Gestion des articles</h1>
            <p className="text-slate-400 text-sm">
              Rédigez de nouveaux articles, modifiez les existants et mettez-en à la une dans le guide.
            </p>
          </div>
        </div>

        <ArticlesManager initialArticles={rows} />
      </main>
    </div>
  );
}
