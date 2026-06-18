"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";

export default function ActivationForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("Le mot de passe doit faire au moins 8 caractères."); return; }
    if (password !== confirm) { setError("Les deux mots de passe ne correspondent pas."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/activer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        setTimeout(() => { router.push("/connexion"); router.refresh(); }, 1800);
      } else {
        setError(data.error ?? "Échec de l'activation.");
      }
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="text-center py-4">
        <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
        <p className="text-white font-semibold">Compte activé !</p>
        <p className="text-slate-400 text-sm mt-1">Redirection vers la connexion…</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-white font-semibold text-lg mb-1">Choisissez votre mot de passe</h1>
      <p className="text-slate-500 text-sm mb-6">Identifiant : <span className="text-slate-300">{email}</span></p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-2.5 text-sm mb-4">{error}</div>
      )}

      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Nouveau mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required autoComplete="new-password" placeholder="Au moins 8 caractères"
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
            />
          </div>
        </div>
        <div>
          <label className="text-slate-400 text-xs block mb-1.5">Confirmez le mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              required autoComplete="new-password" placeholder="••••••••"
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50"
            />
          </div>
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-colors"
        >
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Activer mon compte
        </button>
      </form>
    </>
  );
}
