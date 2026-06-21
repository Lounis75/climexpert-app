import { NextRequest, NextResponse } from "next/server";
import { getUtilisateurByEmail } from "@/lib/utilisateurs";
import { verifyPassword, hashPassword } from "@/lib/password";
import {
  signAdminToken, signTechnicienToken, signCommercialToken,
  COOKIE_NAME, TECH_COOKIE_NAME, COMMERCIAL_COOKIE_NAME,
} from "@/lib/auth";
import { homeSpace } from "@/lib/roles";
import { rateLimit, clientIp } from "@/lib/rate-limit";

// Hash factice pour égaliser le temps de réponse : on exécute toujours scrypt,
// même si le compte n'existe pas, pour ne pas révéler par timing quels emails existent.
const DUMMY_HASH = hashPassword("climexpert-dummy-password");

// Connexion unifiée par identifiant (email) + mot de passe.
// Pour rester 100 % compatible avec l'existant SANS toucher au proxy ni aux
// gardes de page, on émet les MÊMES cookies que les logins historiques
// (admin_token / tech_token / commercial_token) selon les rôles du salarié.
export async function POST(req: NextRequest) {
  // Limite par IP (anti-balayage depuis une source) ET par email (anti-brute-force
  // ciblé via un botnet multi-IP : la clé email plafonne les essais quelle que soit l'IP).
  if (!rateLimit(`login:ip:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans 15 minutes." }, { status: 429 });
  }

  const { email, password } = await req.json().catch(() => ({}));
  if (!email?.trim() || !password) {
    return NextResponse.json({ error: "Identifiant et mot de passe requis" }, { status: 400 });
  }

  const emailKey = email.toLowerCase().trim();
  if (!rateLimit(`login:email:${emailKey}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de tentatives sur ce compte. Réessayez dans 15 minutes." }, { status: 429 });
  }

  const u = await getUtilisateurByEmail(email);
  // Toujours exécuter scrypt (sur le vrai hash ou un hash factice) → temps constant.
  const passwordOk = verifyPassword(password, u?.passwordHash || DUMMY_HASH);
  if (!u || !u.actif || u.supprimeLe || !u.passwordHash || !passwordOk) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const roles = u.roles ?? [];
  const fullName = u.prenom ? `${u.prenom} ${u.nom}` : u.nom;
  const cookieOpts = {
    httpOnly: true, sameSite: "strict" as const, maxAge: 60 * 60 * 24 * 30,
    path: "/", secure: process.env.NODE_ENV === "production",
  };

  const res = NextResponse.json({ ok: true, redirect: homeSpace(roles) });

  if (roles.includes("administrateur")) {
    res.cookies.set(COOKIE_NAME, await signAdminToken({ sub: u.id, email: u.email, nom: u.nom }), cookieOpts);
  }
  if (roles.includes("technicien") && u.technicienId) {
    res.cookies.set(TECH_COOKIE_NAME, await signTechnicienToken({ sub: u.technicienId, email: u.email, name: fullName }), cookieOpts);
  }
  if (roles.includes("commercial") && u.technicienId) {
    res.cookies.set(COMMERCIAL_COOKIE_NAME, await signCommercialToken({ sub: u.technicienId, email: u.email, name: fullName }), cookieOpts);
  }

  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  for (const name of [COOKIE_NAME, TECH_COOKIE_NAME, COMMERCIAL_COOKIE_NAME]) {
    res.cookies.set(name, "", { maxAge: 0, path: "/" });
  }
  return res;
}
