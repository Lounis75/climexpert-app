import AdminHeader from "@/components/AdminHeader";
import { getTechniciens } from "@/lib/techniciens";
import TechniciensManager from "./TechniciensManager";

export const dynamic = "force-dynamic";

export default async function TechniciensPage() {
  const techniciens = await getTechniciens();

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Techniciens</h1>
          <p className="text-slate-400 text-sm">Équipe d&apos;intervention — gestion des techniciens actifs.</p>
        </div>
        <TechniciensManager initialTechniciens={techniciens} />
      </main>
    </div>
  );
}
