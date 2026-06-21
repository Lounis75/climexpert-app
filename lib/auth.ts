import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import { techniciens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface AdminSession {
  sub: string;   // admin id
  email: string;
  nom: string;
}

// Révocation : une session technicien/commercial n'est valide que si la fiche
// technicien est toujours active et non supprimée. Désactiver/supprimer un salarié
// coupe donc ses accès au prochain appel (la couche données fait foi, cf. doc Proxy).
async function technicienEstActif(id: string): Promise<boolean> {
  const [t] = await db
    .select({ active: techniciens.active, supprimeLe: techniciens.supprimeLe })
    .from(techniciens)
    .where(eq(techniciens.id, id))
    .limit(1);
  return !!t && t.active === true && !t.supprimeLe;
}

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET manquant");
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyAdminToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "admin") return null;
    return {
      sub: payload.sub as string,
      email: payload.email as string,
      nom: payload.nom as string,
    };
  } catch {
    return null;
  }
}

export const COOKIE_NAME = "admin_token";

// ─── Technicien auth ──────────────────────────────────────────────────────────

export interface TechnicienSession {
  sub: string;   // technicien id
  email: string;
  name: string;
}

export async function signTechnicienToken(payload: TechnicienSession): Promise<string> {
  return new SignJWT({ ...payload, role: "technicien" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyTechnicienToken(token: string): Promise<TechnicienSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "technicien") return null;
    if (!(await technicienEstActif(payload.sub as string))) return null;
    return {
      sub:   payload.sub as string,
      email: payload.email as string,
      name:  payload.name as string,
    };
  } catch {
    return null;
  }
}

export const TECH_COOKIE_NAME = "tech_token";

// ─── Commercial auth ──────────────────────────────────────────────────────────

export interface CommercialSession {
  sub: string;   // technicien id (role=technico_commercial)
  email: string;
  name: string;
}

export async function signCommercialToken(payload: CommercialSession): Promise<string> {
  return new SignJWT({ ...payload, role: "commercial" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyCommercialToken(token: string): Promise<CommercialSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "commercial") return null;
    if (!(await technicienEstActif(payload.sub as string))) return null;
    return {
      sub:   payload.sub as string,
      email: payload.email as string,
      name:  payload.name as string,
    };
  } catch {
    return null;
  }
}

export const COMMERCIAL_COOKIE_NAME = "commercial_token";
