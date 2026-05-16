import AdminHeader from "@/components/AdminHeader";
import { getAuditLog } from "@/lib/audit";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

function fmt(d: Date | string) {
  return new Date(d).toLocaleString("fr-FR", {
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const ACTION_LABELS: Record<string, string> = {
  update_facture_status:  "Mise à jour facture",
  delete_facture:         "Suppression facture",
  annuler_intervention:   "Annulation intervention",
  rgpd_delete_client:     "Suppression RGPD client",
};

export default async function AuditPage() {
  const logs = await getAuditLog({ limit: 100 });

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-400" /> Journal d&apos;audit
          </h1>
          <p className="text-slate-400 text-sm">Traçabilité des actions sensibles. {logs.length} entrées.</p>
        </div>

        {logs.length === 0 ? (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Aucune action enregistrée pour l&apos;instant.</p>
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-white/8 rounded-2xl overflow-hidden">
            <div className="divide-y divide-white/5">
              {logs.map((log) => (
                <div key={log.id} className="px-5 py-3.5 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-white text-sm font-medium">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </span>
                      {log.tableCible && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 border border-white/10">
                          {log.tableCible}
                        </span>
                      )}
                    </div>
                    {log.idCible && (
                      <p className="text-slate-500 text-xs mt-0.5">ID : {log.idCible}</p>
                    )}
                    <div className="flex gap-4 mt-1 flex-wrap">
                      {log.avantJson && (
                        <p className="text-slate-600 text-xs">
                          Avant : <code className="text-slate-400">{log.avantJson}</code>
                        </p>
                      )}
                      {log.apresJson && (
                        <p className="text-slate-600 text-xs">
                          Après : <code className="text-slate-400">{log.apresJson}</code>
                        </p>
                      )}
                    </div>
                    {log.ip && <p className="text-slate-700 text-[10px] mt-0.5">IP : {log.ip}</p>}
                  </div>
                  <span className="text-slate-600 text-xs flex-shrink-0">{fmt(log.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
