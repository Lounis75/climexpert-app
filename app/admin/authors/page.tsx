import AdminHeader from "@/components/AdminHeader";
import AuthorsManager from "./AuthorsManager";
import { getAuthors } from "@/lib/authors";

export const dynamic = "force-dynamic";

export default async function AuthorsPage() {
  const authors = await getAuthors();
  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Profils auteurs</h1>
          <p className="text-slate-400 text-sm">Gérez les techniciens qui signent les articles du guide.</p>
        </div>
        <AuthorsManager initialAuthors={authors} />
      </main>
    </div>
  );
}
