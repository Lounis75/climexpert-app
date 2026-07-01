import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { revuesDevis, notifications, suivis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { sendChiffrageDevis } from "@/lib/devis-send";
import type { RawLine } from "@/lib/devis-pdf";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

async function admin() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

// Action de l'expert (administrateur) sur une demande d'avis : valider (envoie le devis au client,
// avec les lignes éventuellement modifiées) ou annuler.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const me = await admin();
  if (!me) return NextResponse.json({ error: "Réservé aux administrateurs." }, { status: 403 });
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const [revue] = await db.select().from(revuesDevis).where(eq(revuesDevis.id, id)).limit(1);
  if (!revue) return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
  if (revue.status !== "en_attente") return NextResponse.json({ error: "Cette demande a déjà été traitée." }, { status: 409 });

  const noteExpert = String(body.noteExpert ?? "").slice(0, 2000) || null;

  if (body.action === "annuler") {
    await db.update(revuesDevis).set({
      status: "annulee", noteExpert, revueParId: me.sub, revueParNom: me.nom, revueLe: new Date(), updatedAt: new Date(),
    }).where(eq(revuesDevis.id, id));
    if (revue.leadId) await db.insert(suivis).values({ leadId: revue.leadId, type: "note", contenu: `Demande d'avis annulée par ${me.nom}${noteExpert ? ` : ${noteExpert}` : ""}.` }).catch(() => {});
    await db.insert(notifications).values({
      type: "revue_devis", titre: `Avis expert : demande annulée`,
      contenu: `${me.nom} a annulé la demande d'avis${revue.demandeParNom ? ` de ${revue.demandeParNom}` : ""}.${noteExpert ? ` ${noteExpert}` : ""}`,
      refType: "revue", refId: id,
    }).catch(() => {});
    return NextResponse.json({ ok: true, status: "annulee" });
  }

  if (body.action === "valider") {
    // Lignes éventuellement modifiées par l'expert, sinon celles d'origine.
    const lignes = (Array.isArray(body.lignes) && body.lignes.length ? body.lignes : revue.lignes) as RawLine[];
    const client = (revue.clientSnapshot ?? {}) as Record<string, string>;

    const result = await sendChiffrageDevis({
      leadId: revue.leadId ?? undefined,
      clientId: revue.clientId,
      clientType: revue.clientType,
      client,
      lignes,
      description: revue.description,
      project: revue.project,
      message: body.messageClient,
    });
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });

    await db.update(revuesDevis).set({
      status: "validee", noteExpert, lignes, revueParId: me.sub, revueParNom: me.nom, revueLe: new Date(),
      montantEnvoyeCt: result.montantCt, updatedAt: new Date(),
    }).where(eq(revuesDevis.id, id));

    await db.insert(notifications).values({
      type: "revue_devis", titre: `Devis validé et envoyé au client`,
      contenu: `${me.nom} a validé la demande d'avis${revue.demandeParNom ? ` de ${revue.demandeParNom}` : ""} et envoyé le devis au client.`,
      refType: "lead", refId: result.leadId,
    }).catch(() => {});

    return NextResponse.json({ ok: true, status: "validee", leadId: result.leadId });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
