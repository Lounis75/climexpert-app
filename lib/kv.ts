import { put, list } from "@vercel/blob";

const BLOB_PATH = "admin/featured-articles.json";

export async function getFeaturedSlugs(): Promise<string[]> {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) return [];

    const { blobs } = await list({ prefix: BLOB_PATH, token });
    if (blobs.length === 0) return [];

    const res = await fetch(blobs[0].url, {
      cache: "no-store",
      next: { revalidate: 0 },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function setFeaturedSlugs(slugs: string[]): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) throw new Error("BLOB_READ_WRITE_TOKEN non configuré");

  await put(BLOB_PATH, JSON.stringify(slugs), {
    access: "public",
    contentType: "application/json",
    token,
    addRandomSuffix: false,
  });
}

export async function toggleFeaturedSlug(
  slug: string
): Promise<{ featured: boolean; slugs: string[] }> {
  const current = await getFeaturedSlugs();
  const isFeatured = current.includes(slug);
  const updated = isFeatured
    ? current.filter((s) => s !== slug)
    : [...current, slug];
  await setFeaturedSlugs(updated);
  return { featured: !isFeatured, slugs: updated };
}
