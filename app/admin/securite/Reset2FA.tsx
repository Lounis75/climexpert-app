"use client";
import { useState } from "react";
import { ShieldCheck, QrCode, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

export default function Reset2FA({ adminNom, adminEmail }: { adminNom: string; adminEmail: string }) {
  const [otpauthUrl, setOtpauthUrl] = useState("");
  const [secret, setSecret]   = useState("");
  const [code, setCode]       = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [done, setDone]       = useState(false);

  async function generate() {
    setLoading(true); setError(""); setDone(false);
    try {
      const res = await fetch("/api/admin/2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? "Erreur"); return; }
      setOtpauthUrl(d.otpauthUrl); setSecret(d.totpSecret); setCode("");
    } catch { setError("Erreur réseau"); } finally { setLoading(false); }
  }

  async function confirm() {
    if (code.replace(/\s/g, "").length < 6) { setError("Entrez le code à 6 chiffres affiché dans l'application."); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/2fa", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", secret, code: code.replace(/\s/g, "") }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) { setError(d.error ?? "Erreur"); return; }
      setDone(true);
    } catch { setError("Erreur réseau"); } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-sky-400" /> Sécurité — Authentificateur (2FA)
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Compte <strong className="text-slate-300">{adminNom || adminEmail}</strong>. Reconfigure l&apos;application
          Google Authenticator de ce compte (ex. pour que la personne utilise <strong>son propre téléphone</strong>).
        </p>
      </div>

      {done ? (
        <div className="bg-slate-800/50 border border-emerald-500/30 rounded-2xl p-6 text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <p className="text-white font-semibold mb-1">Authentificateur mis à jour</p>
          <p className="text-slate-400 text-sm">À la prochaine connexion sur <span className="text-slate-300">/admin</span>, utilise le code du <strong>nouvel</strong> Authenticator. L&apos;ancien ne fonctionne plus.</p>
        </div>
      ) : !otpauthUrl ? (
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs leading-relaxed">
              En générant un nouveau QR code, <strong>l&apos;ancien Google Authenticator cessera de fonctionner</strong> dès
              que tu confirmes avec un code du nouveau. Garde un appareil avec un code valide sous la main jusqu&apos;à la confirmation.
            </p>
          </div>
          <button onClick={generate} disabled={loading}
            className="w-full py-3 bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2">
            <QrCode className="w-4 h-4" /> {loading ? "Génération…" : "Générer un nouveau QR code"}
          </button>
          {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-6 space-y-5">
          <ol className="text-slate-300 text-sm space-y-1 list-decimal list-inside">
            <li>Ouvre <strong>Google Authenticator</strong> sur le téléphone de la personne.</li>
            <li>Scanne ce QR code (ou saisis la clé manuelle).</li>
            <li>Entre le code à 6 chiffres affiché, puis confirme.</li>
          </ol>

          {/* QR via api.qrserver.com (pas de lib externe, même approche que le setup) */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauthUrl)}&size=200x200&margin=8`}
            alt="Nouveau QR code 2FA"
            className="w-48 h-48 rounded-xl mx-auto bg-white p-2"
          />
          <p className="text-slate-400 text-xs text-center">
            Clé manuelle :<br />
            <code className="text-sky-400 font-mono text-sm tracking-widest break-all">{secret}</code>
          </p>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Code à 6 chiffres du nouvel Authenticator</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              inputMode="numeric"
              placeholder="123 456"
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-white/10 text-white text-center text-lg tracking-[0.4em] font-mono placeholder-slate-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          {error && <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-2">
            <button onClick={confirm} disabled={loading}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-semibold text-sm rounded-xl transition-colors">
              {loading ? "Vérification…" : "Confirmer et activer"}
            </button>
            <button onClick={generate} disabled={loading} title="Régénérer un autre QR"
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
