import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { techniciens, magicLinkTokens } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { signTechnicienToken, TECH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const [link] = await db
    .select()
    .from(magicLinkTokens)
    .where(eq(magicLinkTokens.token, token))
    .limit(1);

  if (!link) return NextResponse.json({ error: "Lien invalide" }, { status: 401 });
  if (link.usedAt) return NextResponse.json({ error: "Lien déjà utilisé" }, { status: 401 });
  if (link.expiresAt < new Date()) return NextResponse.json({ error: "Lien expiré" }, { status: 401 });

  const [tech] = await db
    .select()
    .from(techniciens)
    .where(eq(techniciens.id, link.technicienId))
    .limit(1);

  if (!tech || tech.supprimeLe) return NextResponse.json({ error: "Compte introuvable" }, { status: 401 });

  // Invalider le token
  await db
    .update(magicLinkTokens)
    .set({ usedAt: new Date() })
    .where(eq(magicLinkTokens.id, link.id));

  // Activer le compte si première connexion
  if (!tech.actif) {
    await db
      .update(techniciens)
      .set({ actif: true })
      .where(eq(techniciens.id, tech.id));
  }

  const jwt = await signTechnicienToken({
    sub:   tech.id,
    email: tech.email,
    name:  tech.prenom ? `${tech.prenom} ${tech.name}` : tech.name,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(TECH_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    path:     "/",
    maxAge:   60 * 60 * 24 * 30, // 30 jours
  });
  return res;
}
