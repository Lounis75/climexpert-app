import { articles } from "@/lib/articles";
import { getFeaturedSlugs } from "@/lib/kv";
import { getDynamicArticles } from "@/lib/dynamicArticles";
import { getAuthors } from "@/lib/authors";
import AdminHeader from "@/components/AdminHeader";
import ArticlesPageTabs from "./ArticlesPageTabs";

export const dynamic = "force-dynamic";

export default async function AdminArticlesPage() {
  const [featuredSlugs, dynamicArticles, authors] = await Promise.all([
    getFeaturedSlugs(),
    getDynamicArticles(),
    getAuthors(),
  ]);

  const dynamicSlugs = new Set(dynamicArticles.map((a) => a.slug));

  const rows = [
    ...dynamicArticles.map((a) => ({
      slug: a.slug,
      title: a.title,
      category: a.category,
      date: a.date,
      readTime: a.readTime,
      featured: featuredSlugs.includes(a.slug),
      isDynamic: true,
    })),
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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Articles</h1>
          <p className="text-slate-400 text-sm">
            Rédigez de nouveaux articles, modifiez les existants et gérez les profils auteurs.
          </p>
        </div>
        <ArticlesPageTabs articles={rows} authors={authors} />
      </main>
    </div>
  );
}
