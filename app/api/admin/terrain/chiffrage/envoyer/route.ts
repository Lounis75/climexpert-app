import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { sendChiffrageDevis } from "@/lib/devis-send";
import type { RawLine } from "@/lib/devis-pdf";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

// Envoi direct du devis au client depuis le chiffrage terrain (génère le PDF, l'envoie, bascule le
// prospect en "devis_envoyé"). Logique partagée avec la validation par un expert (lib/devis-send).
export async function POST(req: NextRequest) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const result = await sendChiffrageDevis({
    leadId: body.leadId,
    clientId: body.clientId,
    clientType: body.clientType,
    client: body.client ?? {},
    lignes: (Array.isArray(body.lignes) ? body.lignes : []) as RawLine[],
    description: body.description,
    project: body.project,
    message: body.message,
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
  return NextResponse.json({ ok: true, leadId: result.leadId });
}
