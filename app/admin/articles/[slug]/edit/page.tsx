import { notFound } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import ArticleEditor from "../../ArticleEditor";
import { getDynamicArticleBySlug } from "@/lib/dynamicArticles";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function EditArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = await getDynamicArticleBySlug(slug);
  if (!article) notFound();

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Modifier l&apos;article</h1>
          <p className="text-slate-400 text-sm">
            Vos modifications seront publiées immédiatement. La date de diffusion se met à jour automatiquement.
          </p>
        </div>
        <ArticleEditor initialArticle={article} isEditing />
      </main>
    </div>
  );
}
