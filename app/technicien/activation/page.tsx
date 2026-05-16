"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ActivationContent() {
  const router = useRouter();
  const params = useSearchParams();
  const token  = params.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [msg, setMsg]       = useState("");

  useEffect(() => {
    if (!token) { setStatus("error"); setMsg("Token manquant."); return; }

    fetch("/api/technicien/verify", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStatus("success");
          setTimeout(() => router.replace("/technicien"), 1500);
        } else {
          setStatus("error");
          setMsg(data.error ?? "Lien invalide ou expiré.");
        }
      })
      .catch(() => { setStatus("error"); setMsg("Erreur réseau."); });
  }, [token, router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
        {status === "loading" && (
          <>
            <div className="w-10 h-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Vérification en cours…</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-bold text-slate-900">Connexion réussie !</p>
            <p className="text-slate-500 text-sm mt-1">Redirection…</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="font-bold text-slate-900 mb-1">Lien invalide</p>
            <p className="text-slate-500 text-sm mb-4">{msg}</p>
            <a href="/technicien/login" className="text-sky-500 text-sm font-medium">
              Demander un nouveau lien →
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function ActivationPage() {
  return (
    <Suspense>
      <ActivationContent />
    </Suspense>
  );
}
