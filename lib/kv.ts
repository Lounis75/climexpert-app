import { r2GetJSON, r2PutJSON } from "@/lib/r2";

const R2_KEY = "admin/featured-articles.json";

export async function getFeaturedSlugs(): Promise<string[]> {
  const data = await r2GetJSON(R2_KEY);
  if (!Array.isArray(data)) return [];
  return data as string[];
}

export async function setFeaturedSlugs(slugs: string[]): Promise<void> {
  await r2PutJSON(R2_KEY, slugs);
}

export async function toggleFeaturedSlug(
  slug: string
): Promise<{ featured: boolean; slugs: string[] }> {
  const current = await getFeaturedSlugs();
  const isFeatured = current.includes(slug);
  const updated = isFeatured ? current.filter((s) => s !== slug) : [...current, slug];
  await setFeaturedSlugs(updated);
  return { featured: !isFeatured, slugs: updated };
}
