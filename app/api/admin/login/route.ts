import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { signAdminToken, COOKIE_NAME } from "@/lib/auth";
import { sessionCookieOptions, clearCookieOptions } from "@/lib/cookie";
import { rateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  // clientIp() : dernier segment / x-real-ip (posé par Vercel, non falsifiable), pas le PREMIER
  // segment de x-forwarded-for qui est fourni par le client. Avant, en faisant tourner l'en-tête
  // X-Forwarded-For, on obtenait une clé différente à chaque requête -> limite inopérante ->
  // brute-force du code TOTP possible. Store partagé (Upstash si configuré).
  if (!(await rateLimit(`admin-login:${clientIp(req)}`, 5, 15 * 60 * 1000))) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans 15 minutes." },
      { status: 429 }
    );
  }

  const { email, code } = await req.json();

  if (!email || !code) {
    return NextResponse.json({ error: "Email et code requis" }, { status: 400 });
  }

  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, email.toLowerCase().trim()))
    .limit(1);

  if (!admin || !admin.actif || admin.supprimeLe || !admin.totpSecret) {
    return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });
  }

  const valid = speakeasy.totp.verify({
    secret: admin.totpSecret,
    encoding: "base32",
    token: code,
    window: 1,
  });

  if (!valid) {
    return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 401 });
  }

  const jwt = await signAdminToken({ sub: admin.id, email: admin.email, nom: admin.nom });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, jwt, sessionCookieOptions(req.headers.get("host")));
  return res;
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", clearCookieOptions(req.headers.get("host")));
  return res;
}
