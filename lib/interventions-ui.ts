// Constantes d'affichage des interventions, SANS dépendance serveur (pas de db).
// Importables depuis des composants client (ex. AgendaMobile) sans embarquer la
// connexion Postgres dans le bundle navigateur.

export const TYPE_LABELS: Record<string, string> = {
  installation: "Installation",
  entretien:    "Entretien",
  depannage:    "Dépannage",
  "contrat-pro": "Contrat pro",
  autre:        "Autre",
};

export const TYPE_COLORS: Record<string, string> = {
  installation:  "bg-sky-500/10 text-sky-400 border-sky-500/30",
  entretien:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  depannage:     "bg-red-500/10 text-red-400 border-red-500/30",
  "contrat-pro": "bg-violet-500/10 text-violet-400 border-violet-500/30",
  autre:         "bg-slate-500/10 text-slate-400 border-slate-500/30",
};

export const STATUS_INTERVENTION: Record<string, { label: string; color: string }> = {
  planifiée:  { label: "Planifiée",  color: "bg-amber-500/10 text-amber-400 border-amber-500/30" },
  en_cours:   { label: "En cours",   color: "bg-sky-500/10 text-sky-400 border-sky-500/30" },
  terminée:   { label: "Terminée",   color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" },
  annulée:    { label: "Annulée",    color: "bg-slate-500/10 text-slate-400 border-slate-500/30" },
};
