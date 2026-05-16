import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { isNull, eq } from "drizzle-orm";
import { randomBytes } from "crypto";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  const session = token ? await verifyAdminToken(token) : null;
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const noToken = await db.select({ id: clients.id }).from(clients).where(isNull(clients.clientToken));

  let updated = 0;
  for (const c of noToken) {
    const clientToken = randomBytes(24).toString("hex");
    await db.update(clients).set({ clientToken }).where(eq(clients.id, c.id));
    updated++;
  }

  return NextResponse.json({ updated });
}
