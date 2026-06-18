import { db } from "@/lib/db";
import { utilisateurs, techniciens, type Utilisateur, type NewUtilisateur } from "@/lib/db/schema";
import { eq, isNull, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { randomBytes } from "node:crypto";

export type { Utilisateur };

// Rôles qui ont besoin d'une fiche technicien (son id sert de sujet de session,
// de clé pour les interventions ET d'identité affectable comme commercial/technicien).
// L'administrateur a TOUS les rôles → on lui provisionne aussi une fiche, pour qu'il
// soit affectable partout (petite structure : le patron est commercial ET technicien).
const ROLES_AVEC_FICHE = ["technicien", "commercial", "administrateur"];

export async function ensureTechnicienLink(u: Utilisateur): Promise<string | null> {
  if (u.technicienId) return u.technicienId;
  if (!u.roles.some((r) => ROLES_AVEC_FICHE.includes(r))) return null;

  const email = u.email.toLowerCase().trim();
  // Réutilise une fiche technicien existante (même email) sinon en crée une.
  const [existing] = await db
    .select({ id: techniciens.id })
    .from(techniciens)
    .where(eq(techniciens.email, email))
    .limit(1);

  let techId = existing?.id;
  if (!techId) {
    const fullName = u.prenom ? `${u.prenom} ${u.nom}` : u.nom;
    // Libellé de rôle (informatif) ; les listes d'affectation se basent sur les
    // rôles de l'UTILISATEUR, pas sur ce champ.
    const role = u.roles.includes("administrateur")
      ? "responsable"
      : u.roles.includes("commercial") && !u.roles.includes("technicien")
        ? "technico_commercial"
        : "technicien";
    // onConflictDoNothing + reselect : robuste à la concurrence (deux appels parallèles
    // qui provisionnent le même email → email unique, on ne crée pas de doublon).
    await db
      .insert(techniciens)
      .values({
        id: createId(), name: fullName, prenom: u.prenom ?? null, email,
        phone: u.phone ?? null, color: u.color ?? undefined, role, active: true, actif: true,
      })
      .onConflictDoNothing({ target: techniciens.email });
    const [t] = await db.select({ id: techniciens.id }).from(techniciens).where(eq(techniciens.email, email)).limit(1);
    techId = t?.id;
  }

  if (!techId) return null;
  await db.update(utilisateurs).set({ technicienId: techId, updatedAt: new Date() }).where(eq(utilisateurs.id, u.id));
  return techId;
}

export type AssignOption = { id: string; name: string; prenom: string | null };

/** Salariés affectables comme COMMERCIAL (rôle commercial OU administrateur),
 *  chacun avec son id de fiche technicien (provisionnée à la volée si besoin). */
export async function getCommerciauxAssignables(): Promise<AssignOption[]> {
  return assignablesPourRoles(["commercial", "administrateur"]);
}

/** Salariés affectables comme TECHNICIEN (rôle technicien OU administrateur). */
export async function getTechniciensAssignables(): Promise<AssignOption[]> {
  return assignablesPourRoles(["technicien", "administrateur"]);
}

async function assignablesPourRoles(roles: string[]): Promise<AssignOption[]> {
  const users = await db
    .select()
    .from(utilisateurs)
    .where(and(isNull(utilisateurs.supprimeLe), eq(utilisateurs.actif, true)));
  const eligibles = users.filter((u) => (u.roles ?? []).some((r) => roles.includes(r)));
  const out: AssignOption[] = [];
  for (const u of eligibles) {
    const techId = await ensureTechnicienLink(u);
    if (techId) out.push({ id: techId, name: u.nom, prenom: u.prenom });
  }
  return out;
}

export async function getUtilisateurs(): Promise<Utilisateur[]> {
  return db.select().from(utilisateurs).where(isNull(utilisateurs.supprimeLe)).orderBy(utilisateurs.nom);
}

export async function getUtilisateurById(id: string): Promise<Utilisateur | null> {
  const [u] = await db.select().from(utilisateurs).where(eq(utilisateurs.id, id));
  return u ?? null;
}

export async function getUtilisateurByEmail(email: string): Promise<Utilisateur | null> {
  const [u] = await db
    .select()
    .from(utilisateurs)
    .where(eq(utilisateurs.email, email.toLowerCase().trim()));
  return u ?? null;
}

export async function createUtilisateur(data: {
  email: string;
  nom: string;
  prenom?: string | null;
  phone?: string | null;
  roles: string[];
  color?: string | null;
  technicienId?: string | null;
}): Promise<Utilisateur> {
  const [u] = await db
    .insert(utilisateurs)
    .values({
      id: createId(),
      email: data.email.toLowerCase().trim(),
      nom: data.nom.trim(),
      prenom: data.prenom?.trim() || null,
      phone: data.phone?.trim() || null,
      roles: data.roles,
      color: data.color ?? undefined,
      technicienId: data.technicienId ?? null,
    })
    .returning();
  const technicienId = await ensureTechnicienLink(u);
  return { ...u, technicienId };
}

export async function updateUtilisateur(
  id: string,
  data: Partial<Pick<NewUtilisateur, "nom" | "prenom" | "phone" | "roles" | "color" | "actif" | "email">>
): Promise<Utilisateur | null> {
  const patch = { ...data, updatedAt: new Date() };
  if (typeof patch.email === "string") patch.email = patch.email.toLowerCase().trim();
  const [u] = await db.update(utilisateurs).set(patch).where(eq(utilisateurs.id, id)).returning();
  if (!u) return null;
  // Si un rôle terrain vient d'être ajouté, on (re)lie une fiche technicien.
  const technicienId = await ensureTechnicienLink(u);
  // Propage l'état actif/inactif vers la fiche technicien → la (dé)sactivation d'un
  // salarié coupe/rouvre ses accès terrain (la garde de session relit techniciens.active).
  if (typeof data.actif === "boolean" && technicienId) {
    await db.update(techniciens).set({ active: data.actif }).where(eq(techniciens.id, technicienId));
  }
  return { ...u, technicienId };
}

/** Définit le mot de passe (haché) et marque l'accès comme configuré. */
export async function setUtilisateurPassword(id: string, passwordHash: string): Promise<void> {
  await db
    .update(utilisateurs)
    .set({ passwordHash, doitDefinirMdp: false, updatedAt: new Date() })
    .where(eq(utilisateurs.id, id));
}

/** Génère un token d'activation (72 h) pour que le salarié choisisse son mot de passe. */
export async function setActivationToken(id: string): Promise<string> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 72 * 3600 * 1000);
  await db
    .update(utilisateurs)
    .set({ activationToken: token, activationExpiresAt: expiresAt, updatedAt: new Date() })
    .where(eq(utilisateurs.id, id));
  return token;
}

export async function getUtilisateurByActivationToken(token: string): Promise<Utilisateur | null> {
  if (!token) return null;
  const [u] = await db.select().from(utilisateurs).where(eq(utilisateurs.activationToken, token)).limit(1);
  return u ?? null;
}

/** Active le compte : pose le mot de passe choisi, consomme le token. */
export async function activateUtilisateur(id: string, passwordHash: string): Promise<void> {
  await db
    .update(utilisateurs)
    .set({
      passwordHash, doitDefinirMdp: false, actif: true,
      activationToken: null, activationExpiresAt: null, updatedAt: new Date(),
    })
    .where(eq(utilisateurs.id, id));
}

export async function deleteUtilisateur(id: string): Promise<void> {
  const u = await getUtilisateurById(id);
  await db.update(utilisateurs).set({ supprimeLe: new Date(), actif: false }).where(eq(utilisateurs.id, id));
  // Révoque aussi l'accès terrain lié (la garde de session relit techniciens).
  if (u?.technicienId) {
    await db.update(techniciens).set({ active: false, supprimeLe: new Date() }).where(eq(techniciens.id, u.technicienId));
  }
}
