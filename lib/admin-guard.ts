import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";

/**
 * Vérifie qu'une requête provient d'un admin authentifié.
 * À utiliser dans les route handlers HORS du préfixe /api/admin (non couverts
 * par le proxy), ex. /api/rgpd/**, pour la défense en profondeur.
 */
export async function isAdminRequest(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;
  return (await verifyAdminToken(token)) !== null;
}
