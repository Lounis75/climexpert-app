import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { getLeadById } from "@/lib/leads";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

// Détail COMPLET d'un prospect (avec les champs lourds exclus du Kanban : notes, transcript Alex,
// qualification, brouillon de chiffrage, photos...). Chargé à l'ouverture d'une fiche.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  return NextResponse.json({ lead });
}
