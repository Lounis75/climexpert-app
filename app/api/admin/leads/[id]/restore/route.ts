import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { suivis } from "@/lib/db/schema";
import { createId } from "@paralleldrive/cuid2";
import { restoreArchivedLead } from "@/lib/leads";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : null;
}

// Ré-ouvre un prospect archivé : il ressort des archives et repart en « Contacté ».
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  try {
    const lead = await restoreArchivedLead(id);
    if (!lead) return NextResponse.json({ error: "Prospect archivé introuvable" }, { status: 404 });
    await db.insert(suivis).values({ id: createId(), leadId: id, adminId: session.sub ?? null, type: "note", contenu: "Prospect ré-ouvert depuis les archives (repassé en « Contacté »)." }).catch(() => {});
    return NextResponse.json({ ok: true, lead });
  } catch (e) {
    logError("leads.restore", e, { leadId: id });
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
