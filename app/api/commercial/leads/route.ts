import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, suivis } from "@/lib/db/schema";
import { eq, isNull, desc, sql, and } from "drizzle-orm";
import { verifyCommercialToken, COMMERCIAL_COOKIE_NAME } from "@/lib/auth";
import { createId } from "@paralleldrive/cuid2";

export const runtime = "nodejs";

async function session(req: NextRequest) {
  const token = req.cookies.get(COMMERCIAL_COOKIE_NAME)?.value;
  return token ? verifyCommercialToken(token) : null;
}

/** Vérifie que le prospect existe ET appartient au commercial connecté. */
async function ownedLead(id: string, commercialId: string) {
  const [lead] = await db.select().from(leads).where(and(eq(leads.id, id), isNull(leads.supprimeLe))).limit(1);
  return lead && lead.commercialId === commercialId ? lead : null;
}

export async function GET(req: NextRequest) {
  const s = await session(req);
  if (!s) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const list = await db.select().from(leads)
    .where(and(eq(leads.commercialId, s.sub), isNull(leads.supprimeLe)))
    .orderBy(desc(leads.createdAt));
  return NextResponse.json({ leads: list });
}

const STATUTS = ["nouveau", "contacté", "devis_envoyé", "gagné", "perdu"];
const ETAPES = ["rdv_a_convenir", "rdv_pris", "devis_a_faire", "a_recontacter", "reflexion", "aucune_opportunite"];

// Le commercial peut désormais PILOTER ses prospects (pas seulement les notes) : statut, prochaine
// étape, date de RDV, montant de devis. Champs sur liste blanche, garde de propriété + verrou de version.
export async function PATCH(req: NextRequest) {
  const s = await session(req);
  if (!s) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { id, version } = body;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const lead = await ownedLead(id, s.sub);
  if (!lead) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });

  const patch: Record<string, unknown> = {};
  if (typeof body.notes === "string") patch.notes = body.notes;
  if (typeof body.status === "string" && STATUTS.includes(body.status)) patch.status = body.status;
  if ("prochaineEtape" in body) patch.prochaineEtape = body.prochaineEtape && ETAPES.includes(body.prochaineEtape) ? body.prochaineEtape : null;
  if ("rdvDate" in body) patch.rdvDate = body.rdvDate ? new Date(body.rdvDate) : null;
  if ("prochaineActionLe" in body) patch.prochaineActionLe = body.prochaineActionLe ? new Date(body.prochaineActionLe) : null;
  if (typeof body.montantDevisCt === "number") patch.montantDevisCt = Math.round(body.montantDevisCt);
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Rien à modifier" }, { status: 400 });

  // Au changement de statut : dater le passage et purger le verrou anti-doublon des relances.
  if (patch.status !== undefined) { patch.statutChangeLe = new Date(); patch.relanceNotifieeLe = null; }

  const conds = [eq(leads.id, id)];
  if (typeof version === "number") conds.push(eq(leads.version, version));
  const [updated] = await db.update(leads)
    .set({ ...patch, version: sql`${leads.version} + 1`, updatedAt: new Date() })
    .where(and(...conds)).returning();
  if (!updated) {
    return NextResponse.json({ error: "Cette fiche a été modifiée par quelqu'un d'autre. Rechargez avant de réenregistrer.", conflict: true, lead }, { status: 409 });
  }
  return NextResponse.json({ lead: updated });
}

// Actions de « premier contact » sur ses propres prospects (mêmes règles que l'admin).
export async function POST(req: NextRequest) {
  const s = await session(req);
  if (!s) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, action } = await req.json().catch(() => ({}));
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
  const lead = await ownedLead(id, s.sub);
  if (!lead) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });

  const log = (type: string, contenu: string) =>
    db.insert(suivis).values({ id: createId(), leadId: id, type, contenu }).catch(() => {});

  if (action === "pas_de_reponse") {
    const [l] = await db.update(leads).set({ tentativesAppel: sql`${leads.tentativesAppel} + 1`, dernierAppelLe: new Date(), version: sql`${leads.version} + 1`, updatedAt: new Date() }).where(eq(leads.id, id)).returning();
    await log("appel", `Appel sans réponse (tentative ${l.tentativesAppel}).`);
    return NextResponse.json({ ok: true, lead: l });
  }
  if (action === "contact_etabli") {
    const [l] = await db.update(leads).set({ status: "contacté", statutChangeLe: new Date(), relanceNotifieeLe: null, version: sql`${leads.version} + 1`, updatedAt: new Date() }).where(eq(leads.id, id)).returning();
    await log("appel", "Contact établi.");
    return NextResponse.json({ ok: true, lead: l });
  }
  if (action === "pas_de_business") {
    const [l] = await db.update(leads).set({ status: "perdu", motifPerdu: "pas_de_business", statutChangeLe: new Date(), relanceNotifieeLe: null, version: sql`${leads.version} + 1`, updatedAt: new Date() }).where(eq(leads.id, id)).returning();
    await log("note", "Hors activité (pas de business) : passé en perdu.");
    return NextResponse.json({ ok: true, lead: l });
  }
  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
