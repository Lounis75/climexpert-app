"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Wind, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [need2fa, setNeed2fa] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, code: need2fa ? code : undefined }),
      });
      const data = await res.json();
      if (res.ok && data.need2fa) {
        // 1re étape validée (mot de passe OK) : on demande le code d'authentification.
        setNeed2fa(true);
        setError("");
      } else if (res.ok) {
        router.push(data.redirect ?? "/admin");
        router.refresh();
      } else {
        if (data.need2fa) setNeed2fa(true);
        setError(data.error ?? "Échec de la connexion");
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

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
          <h1 className="text-white font-semibold text-lg mb-1">Connexion</h1>
          <p className="text-slate-500 text-sm mb-6">Accédez à votre espace ClimExpert.</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-sm mb-4">{error}</div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-slate-400 text-xs block mb-1.5">Identifiant (email)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoComplete="email" placeholder="vous@exemple.fr"
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-slate-400 text-xs block mb-1.5">Mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password" placeholder="••••••••" disabled={need2fa}
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50 disabled:opacity-60"
                />
              </div>
            </div>
            {need2fa && (
              <div>
                <label className="text-slate-400 text-xs block mb-1.5">Code de vérification (application 2FA)</label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sky-400" />
                  <input
                    type="text" inputMode="numeric" autoComplete="one-time-code" value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required autoFocus placeholder="123456"
                    className="w-full bg-slate-900/60 border border-sky-500/40 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm tracking-widest placeholder-slate-600 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            )}
            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              {need2fa ? "Valider le code" : "Se connecter"}
            </button>
          </form>
        </div>

        <p className="text-slate-600 text-xs text-center mt-6">
          Accès réservé aux salariés ClimExpert.
        </p>
      </div>
    </div>
  );
}
