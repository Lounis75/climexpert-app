import AdminHeader from "@/components/AdminHeader";
import ArticleEditor from "../ArticleEditor";

export default function NewArticlePage() {
  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Nouvel article</h1>
          <p className="text-slate-400 text-sm">
            Rédigez et publiez un article. Il apparaîtra immédiatement sur la page Guide.
          </p>
        </div>
        <ArticleEditor />
      </main>
    </div>
  );
}
