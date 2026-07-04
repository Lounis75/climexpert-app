import { NextRequest, NextResponse } from "next/server";
import { createLead, findActiveLeadByPhone } from "@/lib/leads";
import { db } from "@/lib/db";
import { notifications, suivis } from "@/lib/db/schema";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

// Filet de sécurité : quand Alex (l'IA) est en panne, le chat affiche un mini-formulaire
// nom + téléphone qui poste ici. Objectif unique : NE PAS PERDRE le prospect pendant l'incident.
export async function POST(req: NextRequest) {
  if (!(await rateLimit(`chatsos:${clientIp(req)}`, 5, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Trop de tentatives, réessayez dans un instant." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim().slice(0, 120);
  const phone = String(body?.phone ?? "").trim().slice(0, 30);
  if (phone.replace(/\D/g, "").length < 8) {
    return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
  }

  try {
    // Si le numéro est déjà connu, on note simplement le rappel demandé (pas de doublon).
    const existing = await findActiveLeadByPhone(phone);
    const leadId = existing
      ? (await db.insert(suivis).values({ leadId: existing.id, clientId: existing.clientId ?? undefined, type: "note", contenu: "A redemandé un rappel via le formulaire de secours (Alex indisponible)." }).catch(() => {}), existing.id)
      : (await createLead({
          source: "alex",
          name: name || phone,
          phone,
          notes: "Contact capturé par le formulaire de secours (Alex momentanément indisponible). À rappeler.",
        })).id;

    await db.insert(notifications).values({
      adminId: null, type: "nouveau_lead",
      titre: `À rappeler : ${name || phone} (secours Alex)`,
      contenu: "Contact laissé pendant une indisponibilité d'Alex : rappelez-le rapidement.",
      refType: "lead", refId: leadId,
    }).catch((e) => logError("chatsos.notif", e));

    return NextResponse.json({ ok: true });
  } catch (e) {
    logError("chatsos.lead", e, { phone });
    return NextResponse.json({ error: "Enregistrement impossible, appelez-nous directement." }, { status: 500 });
  }
}
