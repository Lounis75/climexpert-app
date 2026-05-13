import { put, list, del } from "@vercel/blob";
import type { Article } from "./articles";

const PREFIX = "dynamic-articles/";

export async function getDynamicArticles(): Promise<Article[]> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return [];

    const { blobs } = await list({ prefix: PREFIX, token });
    if (blobs.length === 0) return [];

    const results = await Promise.all(
      blobs.map(async (blob) => {
        try {
          const res = await fetch(blob.url, { cache: "no-store" });
          if (!res.ok) return null;
          return (await res.json()) as Article;
        } catch {
          return null;
        }
      })
    );

    return (results.filter(Boolean) as Article[]).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch {
    return [];
  }
}

export async function getDynamicArticleBySlug(slug: string): Promise<Article | undefined> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return undefined;

    const { blobs } = await list({ prefix: `${PREFIX}${slug}.json`, token });
    if (blobs.length === 0) return undefined;

    const res = await fetch(blobs[0].url, { cache: "no-store" });
    if (!res.ok) return undefined;
    return (await res.json()) as Article;
  } catch {
    return undefined;
  }
}

export async function saveDynamicArticle(article: Article): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN non configuré");

  await put(`${PREFIX}${article.slug}.json`, JSON.stringify(article), {
    access: "private",
    contentType: "application/json",
    token,
    addRandomSuffix: false,
  });
}

export async function deleteDynamicArticle(slug: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;

  const { blobs } = await list({ prefix: `${PREFIX}${slug}.json`, token });
  if (blobs.length > 0) {
    await del(blobs[0].url, { token });
  }
}
