"use client";

import { useState } from "react";
import { Wind, ShieldCheck, QrCode, CheckCircle2 } from "lucide-react";

interface SetupResult {
  email: string;
  nom: string;
  totpSecret: string;
  otpauthUrl: string;
}

export default function AdminSetup() {
  const [email, setEmail] = useState("");
  const [nom, setNom] = useState("");
  const [secret, setSecret] = useState("");
  const [result, setResult] = useState<SetupResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-setup-secret": secret,
        },
        body: JSON.stringify({ email, nom }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setError(data.error ?? "Erreur");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#080d18] flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="flex items-center gap-2.5 justify-center mb-10">
          <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center">
            <Wind className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-semibold text-lg">
            Clim<span className="text-sky-400">Expert</span>
            <span className="text-slate-500 text-sm font-normal ml-2">setup admin</span>
          </span>
        </div>

        {result ? (
          <div className="bg-slate-800/50 border border-emerald-500/30 rounded-2xl p-8 space-y-6">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
              <p className="font-semibold">Compte admin créé !</p>
            </div>

            <div className="space-y-3">
              <p className="text-slate-300 text-sm">
                Scanne ce code QR avec <strong>Google Authenticator</strong> ou <strong>Authy</strong> :
              </p>
              {/* QR Code via API Google Charts (pas de lib externe) */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(result.otpauthUrl)}&size=200x200&margin=8`}
                alt="QR Code TOTP"
                className="w-48 h-48 rounded-xl mx-auto bg-white p-2"
              />
              <p className="text-slate-400 text-xs text-center">
                Ou entre manuellement la clé :<br />
                <code className="text-sky-400 font-mono text-sm tracking-widest">{result.totpSecret}</code>
              </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
              <p className="text-amber-400 text-xs font-medium">
                ⚠️ Note ce secret maintenant — il ne sera plus affiché.
                Après avoir scanné le QR code, rends-toi sur{" "}
                <a href="/admin" className="underline">/admin</a> pour te connecter.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              <p className="text-slate-300 text-sm font-medium">Création du compte administrateur</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Nom</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  placeholder="Kamel Aissaoui"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@climexpert.fr"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5 font-medium">
                  Clé de setup
                  <span className="text-slate-600 font-normal ml-1">(NEXTAUTH_SECRET du serveur)</span>
                </label>
                <input
                  type="password"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-all"
                />
              </div>

              {error && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email || !nom || !secret}
                className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition-all"
              >
                <QrCode className="w-4 h-4 inline mr-2" />
                {loading ? "Création…" : "Créer le compte et obtenir le QR code"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
