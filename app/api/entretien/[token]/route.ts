import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, contratsEntretien, notifications } from "@/lib/db/schema";
import { eq, and, isNull, sql, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { contratTotalCt, entretienAffichage } from "@/lib/contrat-pricing";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await rateLimit(`entretien:${clientIp(req)}`, 10, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez plus tard." }, { status: 429 });
  }

  try {
    const [client] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.clientToken, token), isNull(clients.supprimeLe)))
      .limit(1);

    if (!client) return NextResponse.json({ error: "Token invalide" }, { status: 404 });

    // Idempotence : un client n'a qu'UN contrat d'entretien actif. Double clic sur
    // « Souscrire », rafraîchissement ou rejeu réseau -> on renvoie le contrat existant
    // au lieu d'en créer un doublon (découvert sinon seulement à la facturation).
    const [dejaActif] = await db
      .select()
      .from(contratsEntretien)
      .where(and(eq(contratsEntretien.clientId, client.id), eq(contratsEntretien.active, true)))
      .orderBy(desc(contratsEntretien.createdAt))
      .limit(1);
    if (dejaActif) return NextResponse.json({ ok: true, contrat: dejaActif, deja: true });

    const body = await req.json().catch(() => ({}));
    const units = Math.min(20, Math.max(1, Math.round(Number(body.units) || 1)));
    const unitsExterieures = Math.min(10, Math.max(1, Math.round(Number(body.unitsExterieures) || 1)));

    const today = new Date().toISOString().split("T")[0];
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const nextVisit = nextYear.toISOString().split("T")[0];

    const contratId = createId();
    const [contrat] = await db
      .insert(contratsEntretien)
      .values({
        id: contratId,
        clientId: client.id,
        units,
        unitsExterieures,
        prixUnitaireCt: contratTotalCt(units, unitsExterieures), // total annuel : 200 + (units-1)*60
        startDate: today,
        nextVisit,
      })
      .returning();

    await db.update(clients).set({ contratEntretienId: contratId, version: sql`${clients.version} + 1` }).where(eq(clients.id, client.id));

    await db.insert(notifications).values({
      id: createId(),
      adminId: null,
      type: "nouveau_contrat",
      titre: `Nouveau contrat entretien, ${client.name}`,
      contenu: (() => { const a = entretienAffichage({ withContract: true, pro: client.typeClient === "professionnel", units, unitsExterieures }); return `${units} unité(s) intérieure(s), ${unitsExterieures} groupe(s) extérieur(s), ${a.montant} € ${a.base}/an`; })(),
      refType: "contrat",
      refId: contratId,
    }).catch((e) => logError("entretien.notif", e, { clientId: client.id }));

    return NextResponse.json({ ok: true, contrat });
  } catch (e) {
    logError("entretien.souscription", e);
    return NextResponse.json({ error: "Erreur serveur, réessayez." }, { status: 500 });
  }
}
