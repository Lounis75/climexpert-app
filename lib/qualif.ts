import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

// Jeton COURT et lisible (sans caractères ambigus) pour un lien SMS court. Porté de 10 à 14
// caractères (~81 bits) : le lien reste court mais l'entropie couvre largement, combinée au
// rate-limit des routes qui le consomment.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
export function shortToken(len = 14): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

// Durée de validité d'un lien de qualification (le prospect est censé y répondre rapidement).
export const QUALIF_TOKEN_TTL_MS = 60 * 24 * 60 * 60 * 1000; // 60 jours

/** Un lien de qualif est-il encore valide ? (null = ancien token sans date -> toléré) */
export function qualifTokenValid(emisLe: Date | string | null | undefined): boolean {
  if (!emisLe) return true;
  return Date.now() - new Date(emisLe).getTime() <= QUALIF_TOKEN_TTL_MS;
}

// Retourne le jeton de qualif du prospect, en le créant (ou en le RÉGÉNÉRANT s'il a expiré : sinon
// on renverrait par SMS un lien de plus de 60 jours qui affiche un 404). Réinitialise aussi le
// funnel (ouvert/répondu/relance) pour repartir sur une nouvelle campagne propre.
export async function ensureQualifToken(leadId: string, current: string | null, currentLe?: Date | string | null): Promise<string> {
  if (current && qualifTokenValid(currentLe)) return current;
  const token = shortToken();
  await db.update(leads).set({
    qualifToken: token, qualifTokenLe: new Date(),
    qualifOuvertLe: null, qualifLe: null, qualifRelanceLe: null,
    updatedAt: new Date(),
  }).where(eq(leads.id, leadId));
  return token;
}

export function qualifLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
  return `${baseUrl}/q/${token}`;
}
