import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, devisEnvois } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

// « Modifier et renvoyer » un devis : recharge l'instantané du chiffrage de cet envoi dans le
// brouillon du prospect, puis l'admin rouvre l'outil de chiffrage (pré-rempli), ajuste et renvoie.
// Le nouvel envoi invalide automatiquement l'ancien lien (cf. lib/devis-send).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const devisId = String(body.devisId ?? "");
  if (!devisId) return NextResponse.json({ error: "Devis manquant" }, { status: 400 });

  const [envoi] = await db.select().from(devisEnvois)
    .where(and(eq(devisEnvois.id, devisId), eq(devisEnvois.leadId, id))).limit(1);
  if (!envoi) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  if (envoi.decision === "accepte") {
    return NextResponse.json({ error: "Ce devis a été accepté par le client, il ne peut plus être modifié. Faites un nouveau devis." }, { status: 400 });
  }
  if (!envoi.chiffrage) {
    return NextResponse.json({ error: "Ce devis a été envoyé avant la mise en place de la modification : refaites un chiffrage depuis la fiche." }, { status: 400 });
  }

  let draft: unknown;
  try { draft = JSON.parse(envoi.chiffrage); }
  catch { return NextResponse.json({ error: "Chiffrage illisible pour ce devis, refaites un chiffrage." }, { status: 400 }); }

  await db.update(leads).set({
    chiffrageBrouillon: draft,
    version: sql`${leads.version} + 1`,
    updatedAt: new Date(),
  }).where(eq(leads.id, id));

  return NextResponse.json({ ok: true, url: `/admin/terrain/chiffrage?lead=${id}` });
}
