import { NextResponse } from "next/server";
import { toggleFeaturedSlug } from "@/lib/kv";

export async function POST(req: Request) {
  const { slug } = await req.json();
  if (!slug || typeof slug !== "string") {
    return NextResponse.json({ error: "slug requis" }, { status: 400 });
  }
  const result = await toggleFeaturedSlug(slug);
  return NextResponse.json(result);
}
