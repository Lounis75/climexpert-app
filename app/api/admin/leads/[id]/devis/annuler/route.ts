import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, devisEnvois, suivis } from "@/lib/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

// Annule un devis envoyé (en attente) : il devient « annulé » (le lien client est bloqué), et si
// c'était le devis courant, le prospect repasse en « Contact établi » pour pouvoir en renvoyer un.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const devisId = String(body.devisId ?? "");
  if (!devisId) return NextResponse.json({ error: "Devis manquant" }, { status: 400 });

  const [envoi] = await db.select().from(devisEnvois).where(and(eq(devisEnvois.id, devisId), eq(devisEnvois.leadId, id))).limit(1);
  if (!envoi) return NextResponse.json({ error: "Devis introuvable" }, { status: 404 });
  if (envoi.decision) return NextResponse.json({ error: "Ce devis a déjà une réponse du client, il n'est plus annulable." }, { status: 400 });

  // Réservation atomique (au cas où le client réponde au même instant).
  const upd = await db.update(devisEnvois)
    .set({ decision: "annule", decisionLe: new Date() })
    .where(and(eq(devisEnvois.id, devisId), isNull(devisEnvois.decision)))
    .returning({ id: devisEnvois.id });
  if (upd.length === 0) return NextResponse.json({ error: "Le client vient de répondre à ce devis." }, { status: 409 });

  // Si c'était le devis courant du prospect, retour en « Contact établi » (devis à refaire).
  let leadReset = false;
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (lead && lead.devisToken === envoi.token) {
    leadReset = true;
    await db.update(leads).set({
      status: "contacté", prochaineEtape: "devis_a_faire",
      devisDecision: null, devisDecisionLe: null, devisMotifRefus: null,
      statutChangeLe: new Date(), relanceNotifieeLe: null,
      version: sql`${leads.version} + 1`, updatedAt: new Date(),
    }).where(eq(leads.id, id));
  }

  await db.insert(suivis).values({ leadId: id, type: "devis", contenu: "Devis annulé (pour en renvoyer un nouveau au client)." }).catch(() => {});

  return NextResponse.json({ ok: true, leadReset });
}
