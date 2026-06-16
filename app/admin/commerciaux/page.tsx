import AdminHeader from "@/components/AdminHeader";
import CommerciauxManager from "./CommerciauxManager";

export const dynamic = "force-dynamic";

export default function CommerciauxPage() {
  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Commerciaux</h1>
          <p className="text-slate-400 text-sm">Gérez l&apos;équipe commerciale et affectez les leads.</p>
        </div>
        <CommerciauxManager />
      </main>
    </div>
  );
}
