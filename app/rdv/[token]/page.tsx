"use client";
import { use, useEffect, useState } from "react";
import { Wind, Calendar, MapPin, User, CheckCircle2, Phone } from "lucide-react";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Autre",
};

type Creneau = { debut: string; fin: string; label: string; technicienId: string };

export default function RdvPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, setState] = useState<"loading" | "ready" | "confirmed" | "error">("loading");
  const [errorCode, setErrorCode] = useState("");
  const [interv, setInterv] = useState<any>(null);
  const [creneaux, setCreneaux] = useState<Creneau[]>([]);
  const [confirming, setConfirming] = useState<number | null>(null);
  const [confirmed, setConfirmed] = useState<Creneau | null>(null);

  useEffect(() => {
    fetch(`/api/rdv/${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setErrorCode(d.error); setState("error"); return; }
        setInterv(d.interv);
        setCreneaux(d.creneaux);
        setState("ready");
      })
      .catch(() => { setErrorCode("token_invalide"); setState("error"); });
  }, [token]);

  async function choisir(idx: number) {
    setConfirming(idx + 1);
    const res = await fetch(`/api/rdv/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ choix: idx + 1 }),
    });
    const d = await res.json();
    if (res.ok) {
      setConfirmed(creneaux[idx]);
      setState("confirmed");
    } else {
      setErrorCode(d.error ?? "erreur");
      setState("error");
    }
    setConfirming(null);
  }

  if (state === "loading") {
    return <Layout><div className="h-32 bg-slate-100 rounded-2xl animate-pulse" /></Layout>;
  }

  if (state === "error") {
    const msgs: Record<string, string> = {
      token_invalide: "Ce lien ne correspond à aucune demande. Contactez-nous pour obtenir un nouveau lien.",
      annulee: "Ce rendez-vous a déjà été annulé.",
      deja_utilise: "Vous avez déjà confirmé ce rendez-vous. Consultez votre email de confirmation.",
    };
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-slate-600 mb-4">{msgs[errorCode] ?? "Une erreur est survenue."}</p>
          <Contact />
        </div>
      </Layout>
    );
  }

  if (state === "confirmed" && confirmed) {
    return (
      <Layout>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-slate-900">Rendez-vous confirmé !</h1>
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
            <p className="text-emerald-800 font-semibold">{confirmed.label}</p>
          </div>
          <p className="text-slate-500 text-sm">Un email de confirmation vous a été envoyé.</p>
          <Link href="/" className="text-sky-500 text-sm">← Retour au site</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <h1 className="text-xl font-bold text-slate-900 mb-2">Choisissez votre créneau</h1>
      {interv && (
        <div className="bg-white border border-slate-100 rounded-2xl p-4 mb-5 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-900">{TYPE_LABELS[interv.type] ?? interv.type}</span>
          </div>
          {interv.address && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400" /> {interv.address}
            </div>
          )}
          {interv.clientName && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <User className="w-4 h-4 text-slate-400" /> {interv.clientName}
            </div>
          )}
        </div>
      )}

      {creneaux.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-slate-500 text-sm mb-4">Aucun créneau disponible pour le moment.</p>
          <Contact />
        </div>
      ) : (
        <div className="space-y-3">
          {creneaux.map((c, i) => (
            <button
              key={i}
              onClick={() => choisir(i)}
              disabled={confirming !== null}
              className="w-full flex items-center gap-4 bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50 rounded-2xl p-4 text-left transition-colors disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="w-5 h-5 text-sky-500" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900 text-sm">{c.label}</p>
              </div>
              {confirming === i + 1 ? (
                <span className="text-xs text-slate-400">…</span>
              ) : (
                <span className="text-xs font-semibold text-sky-500">Choisir →</span>
              )}
            </button>
          ))}
        </div>
      )}
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-xl mx-auto px-4 h-14 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
            <Wind className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-900 text-sm">Clim<span className="text-sky-500">Expert</span></span>
        </div>
      </header>
      <main className="max-w-xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

function Contact() {
  return (
    <div className="space-y-2">
      <p className="text-slate-400 text-xs">Contactez-nous :</p>
      <a href="tel:+33XXXXXXXXX" className="flex items-center justify-center gap-2 text-sky-500 font-semibold text-sm">
        <Phone className="w-4 h-4" /> Nous appeler
      </a>
    </div>
  );
}
