import { NextRequest, NextResponse } from "next/server";
import { articles } from "@/lib/articles";
import { saveDynamicArticle } from "@/lib/dynamicArticles";

export async function POST(req: NextRequest) {
  try {
    const { slug } = await req.json();
    if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

    const article = articles.find((a) => a.slug === slug);
    if (!article) return NextResponse.json({ error: "Article introuvable" }, { status: 404 });

    await saveDynamicArticle(article);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
