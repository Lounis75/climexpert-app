import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { count } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export async function GET() {
  const [{ value }] = await db.select({ value: count() }).from(admins);
  return NextResponse.json({ hasAdmins: value > 0 });
}

export async function POST(req: NextRequest) {
  const setupSecret = req.headers.get("x-setup-secret");
  if (!setupSecret || setupSecret !== process.env.NEXTAUTH_SECRET) {
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
