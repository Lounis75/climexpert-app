import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { getSlotsAdmin, addSlot, deleteSlot } from "@/lib/creneaux-alex";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

export async function GET() {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json({ creneaux: await getSlotsAdmin() });
}

export async function POST(req: NextRequest) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  try {
    if (body.action === "delete") {
      if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
      await deleteSlot(String(body.id));
      return NextResponse.json({ creneaux: await getSlotsAdmin() });
    }

    // Création : soit un créneau unique {debut, fin}, soit plusieurs {debut,fin} d'un coup (slots[]).
    const raw: { debut: string; fin: string }[] = Array.isArray(body.slots) ? body.slots : [{ debut: body.debut, fin: body.fin }];
    const commercialId = body.commercialId || null;
    let added = 0;
    for (const s of raw) {
      const debut = new Date(s.debut), fin = new Date(s.fin);
      if (isNaN(debut.getTime()) || isNaN(fin.getTime()) || fin <= debut) continue;
      if (debut < new Date()) continue; // pas de créneau dans le passé
      await addSlot({ debut, fin, commercialId });
      added++;
    }
    if (added === 0) return NextResponse.json({ error: "Aucun créneau valide (vérifiez les dates, pas de passé)." }, { status: 400 });
    return NextResponse.json({ creneaux: await getSlotsAdmin(), added });
  } catch (e) {
    logError("creneauxAlex.admin", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
