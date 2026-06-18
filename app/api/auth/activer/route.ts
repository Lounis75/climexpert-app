import { NextRequest, NextResponse } from "next/server";
import { getUtilisateurByActivationToken, activateUtilisateur } from "@/lib/utilisateurs";
import { hashPassword } from "@/lib/password";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  if (!rateLimit(`activer:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  }

  const { token, password } = await req.json().catch(() => ({}));
  if (!token || !password) {
    return NextResponse.json({ error: "Lien ou mot de passe manquant" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
  }

  const u = await getUtilisateurByActivationToken(token);
  if (!u || !u.activationExpiresAt || new Date(u.activationExpiresAt) < new Date() || u.supprimeLe) {
    return NextResponse.json({ error: "Lien d'activation invalide ou expiré. Demandez-en un nouveau." }, { status: 400 });
  }

  await activateUtilisateur(u.id, hashPassword(password));
  return NextResponse.json({ ok: true });
}
