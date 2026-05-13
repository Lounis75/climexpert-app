import { NextRequest, NextResponse } from "next/server";
import { saveDynamicArticle, deleteDynamicArticle } from "@/lib/dynamicArticles";
import type { Article } from "@/lib/articles";

export async function POST(req: NextRequest) {
  try {
    const article: Article = await req.json();
    if (!article.slug || !article.title) {
      return NextResponse.json({ error: "slug et title requis" }, { status: 400 });
    }
    await saveDynamicArticle(article);
    return NextResponse.json({ success: true, slug: article.slug });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });
    await deleteDynamicArticle(slug);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
