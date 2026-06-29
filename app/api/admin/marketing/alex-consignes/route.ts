import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { getAlexConsignes, saveAlexConsignes } from "@/lib/alex-consignes";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

export async function GET() {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json({ consignes: await getAlexConsignes() });
}

export async function PUT(req: NextRequest) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const delaiJours = Number(body.delaiJours);
  if (!Number.isFinite(delaiJours) || delaiJours < 1) return NextResponse.json({ error: "Le délai (jours) doit être un nombre positif." }, { status: 400 });
  try {
    await saveAlexConsignes({ delaiJours, consignes: String(body.consignes ?? "") });
    return NextResponse.json({ consignes: await getAlexConsignes() });
  } catch (e) {
    logError("alex.consignes.save", e);
    return NextResponse.json({ error: "Échec de l'enregistrement." }, { status: 500 });
  }
}
