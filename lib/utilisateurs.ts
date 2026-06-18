import { db } from "@/lib/db";
import { utilisateurs, techniciens, type Utilisateur, type NewUtilisateur } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export type { Utilisateur };

// Les rôles "terrain" ont besoin d'une fiche technicien (leur id sert de sujet de
// session et de clé pour les interventions). Sans elle, la connexion ne pose aucun
// cookie et le salarié reste bloqué dehors. On provisionne donc la fiche à la volée.
const ROLES_TERRAIN = ["technicien", "commercial"];

async function ensureTechnicienLink(u: Utilisateur): Promise<string | null> {
  if (u.technicienId) return u.technicienId;
  if (!u.roles.some((r) => ROLES_TERRAIN.includes(r))) return null;

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
    const role = u.roles.includes("commercial") && !u.roles.includes("technicien")
      ? "technico_commercial"
      : "technicien";
    const [t] = await db
      .insert(techniciens)
      .values({
        id: createId(), name: fullName, prenom: u.prenom ?? null, email,
        phone: u.phone ?? null, color: u.color ?? undefined, role, active: true, actif: true,
      })
      .returning({ id: techniciens.id });
    techId = t.id;
  }

  await db.update(utilisateurs).set({ technicienId: techId, updatedAt: new Date() }).where(eq(utilisateurs.id, u.id));
  return techId;
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
  return { ...u, technicienId };
}

/** Définit le mot de passe (haché) et marque l'accès comme configuré. */
export async function setUtilisateurPassword(id: string, passwordHash: string): Promise<void> {
  await db
    .update(utilisateurs)
    .set({ passwordHash, doitDefinirMdp: false, updatedAt: new Date() })
    .where(eq(utilisateurs.id, id));
}

export async function deleteUtilisateur(id: string): Promise<void> {
  await db.update(utilisateurs).set({ supprimeLe: new Date(), actif: false }).where(eq(utilisateurs.id, id));
}
