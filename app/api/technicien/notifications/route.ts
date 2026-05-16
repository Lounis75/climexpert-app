import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { notifications, techniciens } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { verifyTechnicienToken, TECH_COOKIE_NAME } from "@/lib/auth";

async function getSession(req: NextRequest) {
  const token = req.cookies.get(TECH_COOKIE_NAME)?.value;
  return token ? verifyTechnicienToken(token) : null;
}

// Techniciens ont leurs notifs stockées avec adminId = technicienId pour simplicité
// (le champ adminId est nullable dans le schéma)
export async function GET(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "true";

  const rows = await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.adminId, session.sub),
        unreadOnly ? eq(notifications.lu, false) : undefined
      )
    )
    .orderBy(desc(notifications.createdAt))
    .limit(50);

  return NextResponse.json(rows);
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id, all } = await req.json();

  if (all) {
    await db
      .update(notifications)
      .set({ lu: true })
      .where(eq(notifications.adminId, session.sub));
  } else if (id) {
    await db
      .update(notifications)
      .set({ lu: true })
      .where(and(eq(notifications.id, id), eq(notifications.adminId, session.sub)));
  }

  return NextResponse.json({ ok: true });
}
