import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { count } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { timingSafeEqual } from "crypto";

// Secret d'amorçage DÉDIÉ (ne réutilise plus le secret de signature JWT). Repli sur NEXTAUTH_SECRET
// pour ne pas casser un déploiement existant tant que SETUP_SECRET n'est pas défini.
const SETUP_SECRET = process.env.SETUP_SECRET || process.env.NEXTAUTH_SECRET || "";

function secretOk(header: string | null): boolean {
  if (!SETUP_SECRET || !header) return false;
  const a = Buffer.from(header), b = Buffer.from(SETUP_SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
}

// GET protégé : ne divulgue plus publiquement l'existence (ou non) d'un administrateur.
export async function GET(req: NextRequest) {
  if (!secretOk(req.headers.get("x-setup-secret"))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }
  const [{ value }] = await db.select({ value: count() }).from(admins);
  return NextResponse.json({ hasAdmins: value > 0 });
}

export async function POST(req: NextRequest) {
  if (!secretOk(req.headers.get("x-setup-secret"))) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
  }

  const [{ value }] = await db.select({ value: count() }).from(admins);
  if (value > 0) {
    return NextResponse.json({ error: "Un admin existe déjà" }, { status: 409 });
  }

  const { email, nom } = await req.json();
  if (!email || !nom) {
    return NextResponse.json({ error: "email et nom requis" }, { status: 400 });
  }

  const secretData = speakeasy.generateSecret({ name: `ClimExpert Admin (${email})`, length: 20 });
  const totpSecret = secretData.base32;
  const otpauthUrl = secretData.otpauth_url ?? "";
  const id = createId();

  await db.insert(admins).values({ id, email: email.toLowerCase().trim(), nom, totpSecret, actif: true });

  return NextResponse.json({ id, email, nom, totpSecret, otpauthUrl }, { status: 201 });
}
