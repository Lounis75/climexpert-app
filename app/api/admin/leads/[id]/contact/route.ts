import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, suivis } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export const runtime = "nodejs";

async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : null;
}

// Actions de « premier contact » sur un prospect (file d'appels du statut "nouveau") :
//  - pas_de_reponse  : reste en "nouveau", +1 tentative, dernierAppelLe = now (le renvoie en bas
//                      de la file), et trace l'appel dans le journal. Pas de changement de statut.
//  - pas_de_business : passe en "perdu" (demande hors activité, ex. clim mobile), trace.
//  - contact_etabli  : passe en "contacté", trace. La qualification + les prochaines étapes prennent le relais.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const { action } = await req.json().catch(() => ({}));

  const logSuivi = (type: string, contenu: string) =>
    db.insert(suivis).values({ id: createId(), leadId: id, adminId: session?.sub ?? null, type, contenu }).catch(() => {});

  if (action === "pas_de_reponse") {
    const [lead] = await db.update(leads).set({
      tentativesAppel: sql`${leads.tentativesAppel} + 1`,
      dernierAppelLe: new Date(),
      version: sql`${leads.version} + 1`, updatedAt: new Date(),
    }).where(eq(leads.id, id)).returning();
    if (!lead) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
    await logSuivi("appel", `Appel sans réponse (tentative ${lead.tentativesAppel}).`);
    return NextResponse.json({ ok: true, lead });
  }

  if (action === "pas_de_business") {
    const [lead] = await db.update(leads).set({
      status: "perdu", motifPerdu: "pas_de_business",
      statutChangeLe: new Date(), relanceNotifieeLe: null,
      version: sql`${leads.version} + 1`, updatedAt: new Date(),
    }).where(eq(leads.id, id)).returning();
    if (!lead) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
    await logSuivi("note", "Hors activité (pas de business) : passé en perdu.");
    return NextResponse.json({ ok: true, lead });
  }

  if (action === "contact_etabli") {
    const [lead] = await db.update(leads).set({
      status: "contacté",
      statutChangeLe: new Date(), relanceNotifieeLe: null,
      version: sql`${leads.version} + 1`, updatedAt: new Date(),
    }).where(eq(leads.id, id)).returning();
    if (!lead) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
    await logSuivi("appel", "Contact établi.");
    return NextResponse.json({ ok: true, lead });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
