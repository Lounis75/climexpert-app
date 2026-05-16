import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, contratsEntretien, notifications, admins } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.clientToken, token), isNull(clients.supprimeLe)))
    .limit(1);

  if (!client) return NextResponse.json({ error: "Token invalide" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const units = Number(body.units) || 1;

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
      prixUnitaireCt: 20000,
      startDate: today,
      nextVisit,
    })
    .returning();

  await db.update(clients).set({ contratEntretienId: contratId }).where(eq(clients.id, client.id));

  const [admin] = await db.select({ id: admins.id }).from(admins).limit(1);
  if (admin) {
    await db.insert(notifications).values({
      id: createId(),
      adminId: admin.id,
      type: "nouveau_contrat",
      titre: `Nouveau contrat entretien — ${client.name}`,
      contenu: `${units} unité(s) — ${units * 200} €/an`,
      refType: "contrat",
      refId: contratId,
    });
  }

  return NextResponse.json({ ok: true, contrat });
}
