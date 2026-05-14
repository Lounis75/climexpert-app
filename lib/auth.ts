import { SignJWT, jwtVerify } from "jose";

export interface AdminSession {
  sub: string;   // admin id
  email: string;
  nom: string;
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
    .setExpirationTime("8h")
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
