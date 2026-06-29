import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { getInterventionById } from "@/lib/interventions";
import { sendInterventionConfirmation } from "@/lib/intervention-mail";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

// Envoi MANUEL de l'e-mail de confirmation d'intervention au client (bouton sur la fiche).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const i = await getInterventionById(id);
  if (!i) return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });
  if (!i.scheduledAt) return NextResponse.json({ error: "Cette intervention n'a pas de date planifiée." }, { status: 400 });

  const res = await sendInterventionConfirmation({
    clientId: i.clientId,
    type: i.type,
    start: new Date(i.scheduledAt),
    dureeMin: i.dureeEstimeeMinutes ?? 120,
    address: i.address ?? null,
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: res.reason === "no_email" ? "Ce client n'a pas d'adresse e-mail." : "L'e-mail n'a pas pu être envoyé, réessayez." },
      { status: res.reason === "no_email" ? 400 : 502 },
    );
  }
  return NextResponse.json({ ok: true });
}
