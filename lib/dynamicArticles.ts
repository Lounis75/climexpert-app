import { db } from "@/lib/db";
import { dynamicArticles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import type { Article } from "./articles";

export async function getDynamicArticles(): Promise<Article[]> {
  try {
    const rows = await db.select().from(dynamicArticles).orderBy(dynamicArticles.createdAt);
    return rows
      .map((r) => {
        try { return JSON.parse(r.data) as Article; } catch { return null; }
      })
      .filter(Boolean) as Article[];
  } catch {
    return [];
  }
}

/** Un article est public si sa date de publication programmée est absente ou
 *  déjà passée. Les articles statiques (sans publishedAt) sont toujours publics. */
export function isPublished(article: Pick<Article, "publishedAt">): boolean {
  if (!article.publishedAt) return true;
  return new Date(article.publishedAt).getTime() <= Date.now();
}

/** Articles dynamiques visibles publiquement (exclut les articles programmés
 *  dont la date est dans le futur). À utiliser sur le site ; l'admin utilise
 *  getDynamicArticles() pour tout voir. */
export async function getPublishedDynamicArticles(): Promise<Article[]> {
  const all = await getDynamicArticles();
  return all.filter(isPublished);
}

export async function getDynamicArticleBySlug(slug: string): Promise<Article | undefined> {
  try {
    const [row] = await db.select().from(dynamicArticles).where(eq(dynamicArticles.slug, slug));
    if (!row) return undefined;
    return JSON.parse(row.data) as Article;
  } catch {
    return undefined;
  }
}

export async function saveDynamicArticle(article: Article): Promise<void> {
  const existing = await db.select({ id: dynamicArticles.id })
    .from(dynamicArticles)
    .where(eq(dynamicArticles.slug, article.slug));

  if (existing.length > 0) {
    await db.update(dynamicArticles)
      .set({ data: JSON.stringify(article), updatedAt: new Date() })
      .where(eq(dynamicArticles.slug, article.slug));
  } else {
    await db.insert(dynamicArticles).values({
      id: createId(),
      slug: article.slug,
      data: JSON.stringify(article),
    });
  }
}

export async function deleteDynamicArticle(slug: string): Promise<void> {
  await db.delete(dynamicArticles).where(eq(dynamicArticles.slug, slug));
}
