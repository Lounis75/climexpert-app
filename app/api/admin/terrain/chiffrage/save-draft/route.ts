import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { resolveLeadId } from "@/lib/chiffrage-server";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

// Enregistre un brouillon de chiffrage sur un prospect (créé si nécessaire).
export async function POST(req: NextRequest) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => null);
  const draft = body?.draft;
  if (!draft || typeof draft !== "object") return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  if (!draft.client?.nom?.trim() && !draft.client?.entreprise?.trim()) {
    return NextResponse.json({ error: "Renseigne au moins le nom du client (ou l'entreprise) pour enregistrer le brouillon." }, { status: 400 });
  }
  const clientType = draft.clientType === "pro" ? "pro" : "particulier";
  try {
    const { id, created } = await resolveLeadId(body.leadId, draft.client, clientType);
    await db.update(leads)
      .set({ chiffrageBrouillon: { ...draft, leadId: id, savedAt: new Date().toISOString() }, updatedAt: new Date() })
      .where(eq(leads.id, id));
    return NextResponse.json({ ok: true, leadId: id, created });
  } catch (e) {
    console.error("[chiffrage save-draft]", e);
    return NextResponse.json({ error: "Échec de l'enregistrement du brouillon." }, { status: 500 });
  }
}
