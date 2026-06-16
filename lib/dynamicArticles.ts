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
