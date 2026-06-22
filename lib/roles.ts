// Vocabulaire des rôles — EXTENSIBLE : ajoute simplement une entrée ici pour
// créer une nouvelle fonction (ex. "responsable_planning", "sav") sans migration DB.
// Les rôles sont stockés en tableau sur utilisateurs.roles.

export const ROLES = {
  administrateur: {
    label: "Administrateur",
    description: "Accès complet. Peut cumuler toutes les fonctions.",
    color: "#0ea5e9",
    space: "/admin",
  },
  commercial: {
    label: "Commercial",
    description: "Gère les prospects et les devis.",
    color: "#8b5cf6",
    space: "/commercial",
  },
  technicien: {
    label: "Technicien",
    description: "Réalise les interventions et les rapports.",
    color: "#10b981",
    space: "/technicien",
  },
} as const;

export type Role = keyof typeof ROLES;

export const ALL_ROLES = Object.keys(ROLES) as Role[];

export function isRole(value: string): value is Role {
  return value in ROLES;
}

/** Un administrateur peut cumuler tous les rôles ; les autres fonctions sont
 *  exclusives entre elles (un technicien ne fait pas le commercial, et inversement). */
export function isValidRoleCombination(roles: string[]): boolean {
  const known = roles.filter(isRole);
  if (known.length === 0) return false;
  if (known.includes("administrateur")) return true; // admin = cumul autorisé
  // Hors admin : une seule fonction métier à la fois
  return known.length === 1;
}

export function hasRole(roles: string[] | null | undefined, role: Role): boolean {
  return !!roles && roles.includes(role);
}

/** Espace d'accueil prioritaire selon les rôles (admin > commercial > technicien). */
export function homeSpace(roles: string[]): string {
  if (hasRole(roles, "administrateur")) return "/admin/interventions";
  if (hasRole(roles, "commercial")) return "/commercial";
  if (hasRole(roles, "technicien")) return "/technicien";
  return "/";
}
