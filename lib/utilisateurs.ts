import { db } from "@/lib/db";
import { utilisateurs, type Utilisateur, type NewUtilisateur } from "@/lib/db/schema";
import { eq, isNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export type { Utilisateur };

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
  return u;
}

export async function updateUtilisateur(
  id: string,
  data: Partial<Pick<NewUtilisateur, "nom" | "prenom" | "phone" | "roles" | "color" | "actif" | "email">>
): Promise<Utilisateur | null> {
  const patch = { ...data, updatedAt: new Date() };
  if (typeof patch.email === "string") patch.email = patch.email.toLowerCase().trim();
  const [u] = await db.update(utilisateurs).set(patch).where(eq(utilisateurs.id, id)).returning();
  return u ?? null;
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
