import { Wind, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { getUtilisateurByActivationToken } from "@/lib/utilisateurs";
import ActivationForm from "./ActivationForm";

export const dynamic = "force-dynamic";

export default async function ActivationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const u = await getUtilisateurByActivationToken(token);
  const valide = u && u.activationExpiresAt && new Date(u.activationExpiresAt) >= new Date() && !u.supprimeLe;

  return (
    <div className="min-h-screen bg-[#080d18] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center">
            <Wind className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg">ClimExpert</span>
        </div>

        <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-6">
          {valide ? (
            <ActivationForm token={token} email={u!.email} />
          ) : (
            <div className="text-center py-2">
              <AlertTriangle className="w-9 h-9 text-amber-400 mx-auto mb-3" />
              <p className="text-white font-semibold">Lien invalide ou expiré</p>
              <p className="text-slate-400 text-sm mt-1 mb-4">
                Ce lien d&apos;activation n&apos;est plus valable. Demandez à un administrateur de vous en renvoyer un.
              </p>
              <Link href="/connexion" className="text-sky-400 hover:text-sky-300 text-sm underline underline-offset-2">
                Aller à la connexion
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
