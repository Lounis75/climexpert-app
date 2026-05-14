import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { signAdminToken, COOKIE_NAME } from "@/lib/auth";

const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const rec = attempts.get(ip);
  if (!rec || now > rec.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return true;
  }
  if (rec.count >= 5) return false;
  rec.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";

  if (!checkRateLimit(ip)) {
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
  res.cookies.set(COOKIE_NAME, jwt, {
    httpOnly: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 8,
    path: "/",
    secure: process.env.NODE_ENV === "production",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
  return res;
}
