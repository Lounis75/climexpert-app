import { getDevisByToken, centimesToEuros } from "@/lib/devis";
import { notFound } from "next/navigation";
import { Phone, Mail, MapPin, FileText, Calendar } from "lucide-react";
import DevisPublicActions from "./DevisPublicActions";

export const dynamic = "force-dynamic";

const COMPANY = {
  name: "CLIM EXPERT SAS",
  address: "200 rue de la Croix Nivert",
  city: "75015 Paris",
  phone: "06 67 43 27 67",
  email: "contact@climexpert.fr",
  siret: "XXX XXX XXX 00000",
};

export default async function DevisPublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const d = await getDevisByToken(token);
  if (!d) notFound();

  const totalHt = d.lignes.reduce((s, l) => s + l.quantite * l.prixUnitaireCt, 0);
  const totalTva = d.lignes.reduce((s, l) => {
    const ht = l.quantite * l.prixUnitaireCt;
    return s + Math.round(ht * (Number(l.tvaRate) / 100));
  }, 0);
  const totalTtc = totalHt + totalTva;

  const isExpired = d.validUntil && new Date(d.validUntil) < new Date();
  const canRespond = d.status === "envoyé" && !isExpired;

  const statusLabel: Record<string, { label: string; cls: string }> = {
    brouillon:  { label: "Brouillon",  cls: "bg-slate-100 text-slate-600" },
    envoyé:     { label: "En attente de votre réponse", cls: "bg-sky-50 text-sky-700 border border-sky-200" },
    accepté:    { label: "Accepté — merci !",           cls: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
    refusé:     { label: "Refusé",                      cls: "bg-red-50 text-red-600 border border-red-200" },
    expiré:     { label: "Expiré",                      cls: "bg-amber-50 text-amber-700 border border-amber-200" },
  };
  const statusInfo = (isExpired && d.status === "envoyé")
    ? { label: "Expiré", cls: "bg-amber-50 text-amber-700 border border-amber-200" }
    : (statusLabel[d.status] ?? statusLabel.brouillon);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-100 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
              <span className="text-white font-bold text-xs">C</span>
            </div>
            <span className="font-bold text-slate-900 text-sm">ClimExpert</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="flex items-center gap-1.5 hover:text-sky-600 transition-colors">
              <Phone className="w-3.5 h-3.5" />
              {COMPANY.phone}
            </a>
            <a href={`mailto:${COMPANY.email}`} className="hidden sm:flex items-center gap-1.5 hover:text-sky-600 transition-colors">
              <Mail className="w-3.5 h-3.5" />
              {COMPANY.email}
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        {/* Header devis */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          <div className="flex items-start justify-between gap-4 flex-wrap mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{d.number}</h1>
              <p className="text-slate-500 text-sm mt-0.5">
                Établi le {new Date(d.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${statusInfo.cls}`}>
              {statusInfo.label}
            </span>
          </div>

          {/* Deux colonnes : émetteur / destinataire */}
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">De</p>
              <p className="font-bold text-slate-800">{COMPANY.name}</p>
              <div className="mt-1.5 space-y-1 text-sm text-slate-500">
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{COMPANY.address}, {COMPANY.city}</p>
                <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0" />{COMPANY.phone}</p>
                <p className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 flex-shrink-0" />{COMPANY.email}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">À l&apos;attention de</p>
              <p className="font-bold text-slate-800">{d.clientName}</p>
            </div>
          </div>

          {/* Méta */}
          <div className="grid sm:grid-cols-2 gap-3 mt-6">
            {d.validUntil && (
              <div className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm ${isExpired ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"}`}>
                <Calendar className="w-4 h-4 flex-shrink-0" />
                <span>Valable jusqu&apos;au <strong>{new Date(d.validUntil).toLocaleDateString("fr-FR")}</strong></span>
              </div>
            )}
            {d.description && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-slate-50 text-slate-600 text-sm sm:col-span-2">
                <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{d.description}</span>
              </div>
            )}
          </div>
        </div>

        {/* Lignes */}
        {d.lignes.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-900 text-sm">Détail de la prestation</h2>
            </div>

            <div className="hidden sm:grid grid-cols-[2fr_60px_120px_60px_120px] gap-3 px-6 py-2.5 text-xs font-medium text-slate-400 bg-slate-50 border-b border-slate-100">
              <span>Désignation</span>
              <span>Qté</span>
              <span>P.U. HT</span>
              <span>TVA</span>
              <span className="text-right">Total TTC</span>
            </div>

            <div className="divide-y divide-slate-100">
              {d.lignes.map((l) => {
                const ht = l.quantite * l.prixUnitaireCt;
                const tva = Math.round(ht * (Number(l.tvaRate) / 100));
                const ttc = ht + tva;
                return (
                  <div
                    key={l.id}
                    className="grid sm:grid-cols-[2fr_60px_120px_60px_120px] grid-cols-1 gap-2 px-6 py-3.5 items-center"
                  >
                    <span className="text-slate-800 text-sm font-medium">{l.designation}</span>
                    <span className="text-slate-500 text-sm">{l.quantite}</span>
                    <span className="text-slate-600 text-sm tabular-nums">{centimesToEuros(l.prixUnitaireCt)}</span>
                    <span className="text-slate-400 text-sm">{String(l.tvaRate)}%</span>
                    <span className="text-right text-slate-800 text-sm font-semibold tabular-nums">{centimesToEuros(ttc)}</span>
                  </div>
                );
              })}
            </div>

            {/* Totaux */}
            <div className="border-t border-slate-100 px-6 py-5 flex justify-end bg-slate-50/50">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm text-slate-500">
                  <span>Total HT</span>
                  <span className="tabular-nums">{centimesToEuros(totalHt)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500">
                  <span>TVA</span>
                  <span className="tabular-nums">{centimesToEuros(totalTva)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t border-slate-200 pt-2 mt-2">
                  <span className="text-slate-900">Total TTC</span>
                  <span className="text-sky-600 tabular-nums">{centimesToEuros(totalTtc)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions client */}
        {canRespond && (
          <DevisPublicActions token={token} />
        )}

        {/* Mention après action */}
        {d.status === "accepté" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
            <p className="text-emerald-700 font-semibold mb-1">Devis accepté</p>
            <p className="text-emerald-600 text-sm">Notre équipe vous contactera très prochainement pour planifier l&apos;intervention.</p>
            <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors">
              <Phone className="w-4 h-4" /> Nous appeler
            </a>
          </div>
        )}

        {d.status === "refusé" && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center">
            <p className="text-slate-600 text-sm">Vous avez refusé ce devis. N&apos;hésitez pas à nous contacter si vous souhaitez discuter de votre projet.</p>
            <a href={`tel:${COMPANY.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-semibold rounded-xl transition-colors">
              <Phone className="w-4 h-4" /> Nous appeler
            </a>
          </div>
        )}

        {/* Mentions légales */}
        <div className="text-center text-xs text-slate-400 pb-6 space-y-1">
          <p>{COMPANY.name} · {COMPANY.address}, {COMPANY.city}</p>
          <p>SIRET {COMPANY.siret} · contact@climexpert.fr</p>
        </div>
      </main>
    </div>
  );
}
