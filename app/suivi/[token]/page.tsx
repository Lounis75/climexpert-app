import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { clients, interventions, factures, savTickets, techniciens } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { Wind, Wrench, FileText, HeadphonesIcon, CalendarDays, CheckCircle2, Clock, AlertTriangle, Shield } from "lucide-react";
import Link from "next/link";

const TYPE_LABELS: Record<string, string> = {
  installation: "Installation", entretien: "Entretien",
  depannage: "Dépannage", "contrat-pro": "Contrat pro", autre: "Autre",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  planifiée:  { label: "Planifiée",  color: "bg-blue-100 text-blue-700" },
  en_cours:   { label: "En cours",   color: "bg-amber-100 text-amber-700" },
  terminée:   { label: "Terminée",   color: "bg-emerald-100 text-emerald-700" },
  annulée:    { label: "Annulée",    color: "bg-red-100 text-red-700" },
};

const SAV_STATUS: Record<string, string> = {
  ouvert:   "Ouvert",
  en_cours: "En cours",
  résolu:   "Résolu",
  fermé:    "Fermé",
};

function fmtDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

function fmtDateTime(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

export default async function SuiviPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.clientToken, token), isNull(clients.supprimeLe)))
    .limit(1);

  if (!client) notFound();

  const [clientInterventions, clientFactures, clientTickets] = await Promise.all([
    db
      .select({
        id:          interventions.id,
        type:        interventions.type,
        status:      interventions.status,
        scheduledAt: interventions.scheduledAt,
        address:     interventions.address,
        techName:    techniciens.name,
      })
      .from(interventions)
      .leftJoin(techniciens, eq(interventions.technicienId, techniciens.id))
      .where(and(eq(interventions.clientId, client.id), isNull(interventions.supprimeLe)))
      .orderBy(desc(interventions.scheduledAt))
      .limit(10),

    db
      .select({
        id:         factures.id,
        number:     factures.number,
        totalTtcCt: factures.totalTtcCt,
        status:     factures.status,
        paidAt:     factures.paidAt,
        createdAt:  factures.createdAt,
      })
      .from(factures)
      .where(eq(factures.clientId, client.id))
      .orderBy(desc(factures.createdAt))
      .limit(10),

    db
      .select()
      .from(savTickets)
      .where(eq(savTickets.clientId, client.id))
      .orderBy(desc(savTickets.createdAt))
      .limit(5),
  ]);

  const garantieExpired = client.garantieExpireLe ? new Date(client.garantieExpireLe) < new Date() : null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
              <Wind className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Clim<span className="text-sky-500">Expert</span></span>
          </div>
          <span className="text-xs text-slate-500">Espace client</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Bienvenue */}
        <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-3xl p-6 text-white">
          <p className="text-sky-100 text-sm mb-1">Bonjour,</p>
          <h1 className="text-2xl font-bold">{client.name}</h1>
          {client.equipementInstalle && (
            <div className="mt-3 flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2">
              <Wrench className="w-4 h-4 flex-shrink-0" />
              <p className="text-sm">{[client.equipementInstalle, client.marqueModele].filter(Boolean).join(" — ")}</p>
            </div>
          )}
        </div>

        {/* Garantie */}
        {client.garantieExpireLe && (
          <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
            garantieExpired
              ? "bg-red-50 border-red-200"
              : "bg-emerald-50 border-emerald-200"
          }`}>
            <Shield className={`w-5 h-5 flex-shrink-0 ${garantieExpired ? "text-red-500" : "text-emerald-500"}`} />
            <div>
              <p className={`text-sm font-semibold ${garantieExpired ? "text-red-800" : "text-emerald-800"}`}>
                {garantieExpired ? "Garantie expirée" : "Sous garantie"}
              </p>
              <p className={`text-xs ${garantieExpired ? "text-red-600" : "text-emerald-600"}`}>
                {garantieExpired ? "Expirée le " : "Valide jusqu'au "}{fmtDate(client.garantieExpireLe)}
              </p>
            </div>
          </div>
        )}

        {/* Entretien annuel */}
        {!client.contratEntretienId && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
            <p className="text-amber-800 text-sm font-semibold mb-1">Entretien annuel recommandé</p>
            <p className="text-amber-700 text-xs mb-3">Prolongez la durée de vie de votre équipement et préservez votre garantie.</p>
            <Link
              href={`/entretien/${token}`}
              className="inline-block bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              Souscrire un contrat d'entretien
            </Link>
          </div>
        )}

        {/* Interventions */}
        <section>
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-slate-400" /> Interventions
          </h2>
          {clientInterventions.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-slate-400 text-sm">Aucune intervention.</div>
          ) : (
            <div className="space-y-2">
              {clientInterventions.map((i) => {
                const s = STATUS_LABELS[i.status] ?? { label: i.status, color: "bg-slate-100 text-slate-600" };
                return (
                  <div key={i.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
                    <Wrench className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{TYPE_LABELS[i.type] ?? i.type}</p>
                      <p className="text-xs text-slate-500">{fmtDateTime(i.scheduledAt)}{i.techName ? ` — ${i.techName}` : ""}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Factures */}
        <section>
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" /> Factures
          </h2>
          {clientFactures.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-slate-400 text-sm">Aucune facture.</div>
          ) : (
            <div className="space-y-2">
              {clientFactures.map((f) => (
                <div key={f.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900">{f.number}</p>
                    <p className="text-xs text-slate-500">{fmtDate(f.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">{f.totalTtcCt ? `${(f.totalTtcCt / 100).toFixed(2)} €` : "—"}</p>
                    <span className={`text-[10px] font-semibold ${f.status === "payée" ? "text-emerald-600" : "text-amber-600"}`}>
                      {f.status === "payée" ? "Payée" : "En attente"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* SAV */}
        <section>
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <HeadphonesIcon className="w-4 h-4 text-slate-400" /> SAV
          </h2>
          {clientTickets.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 text-center text-slate-400 text-sm">Aucun ticket SAV.</div>
          ) : (
            <div className="space-y-2">
              {clientTickets.map((t) => (
                <div key={t.id} className="bg-white border border-slate-100 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-semibold text-slate-900">{t.subject}</p>
                    <span className="text-xs text-slate-500">{SAV_STATUS[t.status] ?? t.status}</span>
                  </div>
                  {t.description && <p className="text-xs text-slate-500 line-clamp-2">{t.description}</p>}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Contact */}
        <div className="bg-slate-900 rounded-3xl p-6 text-center">
          <p className="text-white font-semibold mb-1">Un problème ou une question ?</p>
          <p className="text-slate-400 text-sm mb-4">Notre équipe est disponible 7j/7.</p>
          <a
            href="tel:+33XXXXXXXXX"
            className="inline-block bg-sky-500 hover:bg-sky-400 text-white font-semibold text-sm px-6 py-3 rounded-2xl transition-colors"
          >
            Nous contacter
          </a>
        </div>
      </main>
    </div>
  );
}
