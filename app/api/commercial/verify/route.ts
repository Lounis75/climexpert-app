import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { techniciens, magicLinkTokens } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { signCommercialToken, COMMERCIAL_COOKIE_NAME } from "@/lib/auth";
import { sessionCookieOptions, clearCookieOptions } from "@/lib/cookie";

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 400 });

  const [link] = await db.select().from(magicLinkTokens).where(eq(magicLinkTokens.token, token)).limit(1);
  if (!link)       return NextResponse.json({ error: "Lien invalide" }, { status: 401 });
  if (link.usedAt) return NextResponse.json({ error: "Lien déjà utilisé" }, { status: 401 });
  if (link.expiresAt < new Date()) return NextResponse.json({ error: "Lien expiré" }, { status: 401 });

  const [tech] = await db.select().from(techniciens).where(eq(techniciens.id, link.technicienId)).limit(1);
  if (!tech || tech.supprimeLe || tech.role !== "technico_commercial") {
    return NextResponse.json({ error: "Compte introuvable" }, { status: 401 });
  }

  await db.update(magicLinkTokens).set({ usedAt: new Date() }).where(eq(magicLinkTokens.id, link.id));
  if (!tech.actif) {
    await db.update(techniciens).set({ actif: true }).where(eq(techniciens.id, tech.id));
  }

  const jwt = await signCommercialToken({
    sub:   tech.id,
    email: tech.email,
    name:  tech.prenom ? `${tech.prenom} ${tech.name}` : tech.name,
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COMMERCIAL_COOKIE_NAME, jwt, sessionCookieOptions(req.headers.get("host")));
  return res;
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COMMERCIAL_COOKIE_NAME, "", clearCookieOptions(req.headers.get("host")));
  return res;
}
