import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { suivis, admins } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

const ALLOWED_TYPES = ["appel", "email", "sms", "note", "visite"];

async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : null;
}

// Journal des échanges d'un prospect (appel/email/sms/visite/note), du plus récent au plus ancien.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rows = await db
    .select({ id: suivis.id, type: suivis.type, contenu: suivis.contenu, createdAt: suivis.createdAt, auteur: admins.nom })
    .from(suivis)
    .leftJoin(admins, eq(suivis.adminId, admins.id))
    .where(eq(suivis.leadId, id))
    .orderBy(desc(suivis.createdAt));
  return NextResponse.json({ suivis: rows });
}

// Logge un échange sur le prospect, signé par l'admin connecté.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const body = await req.json().catch(() => ({}));
  const type = ALLOWED_TYPES.includes(body.type) ? body.type : "note";
  const contenu = typeof body.contenu === "string" ? body.contenu.trim() : "";
  if (!contenu) return NextResponse.json({ error: "Contenu requis" }, { status: 400 });

  const sid = createId();
  try {
    await db.insert(suivis).values({ id: sid, leadId: id, adminId: session?.sub ?? null, type, contenu });
  } catch (e) {
    console.error("[suivis POST]", e);
    return NextResponse.json({ error: "Échec de l'enregistrement" }, { status: 500 });
  }
  return NextResponse.json(
    { suivi: { id: sid, type, contenu, createdAt: new Date().toISOString(), auteur: session?.nom ?? null } },
    { status: 201 },
  );
}
