import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

// Jeton COURT et lisible (sans caractères ambigus) pour un lien de qualification le plus court possible.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
export function shortToken(len = 10): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// Retourne le jeton de qualif du prospect, en le créant (et le persistant) s'il n'existe pas encore.
export async function ensureQualifToken(leadId: string, current: string | null): Promise<string> {
  if (current) return current;
  const token = shortToken();
  await db.update(leads).set({ qualifToken: token, updatedAt: new Date() }).where(eq(leads.id, leadId));
  return token;
}

export function qualifLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
  return `${baseUrl}/q/${token}`;
}
