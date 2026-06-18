import AdminHeader from "@/components/AdminHeader";
import { getUtilisateurs } from "@/lib/utilisateurs";
import SalariesManager from "./SalariesManager";

export const dynamic = "force-dynamic";

export default async function SalariesPage() {
  const list = await getUtilisateurs();
  const rows = list.map((u) => ({
    id: u.id,
    email: u.email,
    nom: u.nom,
    prenom: u.prenom,
    phone: u.phone,
    roles: u.roles ?? [],
    color: u.color,
    actif: u.actif,
    hasAccess: !!u.passwordHash,
  }));

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Salariés &amp; accès</h1>
          <p className="text-slate-400 text-sm">
            Gérez votre équipe et leurs rôles. Un administrateur peut cumuler les fonctions ;
            les autres rôles sont exclusifs.
          </p>
        </div>
        <SalariesManager initial={rows} />
      </main>
    </div>
  );
}
