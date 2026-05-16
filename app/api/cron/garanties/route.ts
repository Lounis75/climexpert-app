import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, notifications, admins } from "@/lib/db/schema";
import { and, isNull, lte, gte, isNotNull } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

// Called daily by Vercel Cron — checks for warranties expiring in 30 days
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const in30days = new Date(today);
  in30days.setDate(today.getDate() + 30);

  const todayStr = today.toISOString().split("T")[0];
  const in30Str = in30days.toISOString().split("T")[0];

  const expiringClients = await db
    .select({
      id:              clients.id,
      name:            clients.name,
      garantieExpireLe: clients.garantieExpireLe,
    })
    .from(clients)
    .where(
      and(
        isNull(clients.supprimeLe),
        isNotNull(clients.garantieExpireLe),
        gte(clients.garantieExpireLe, todayStr),
        lte(clients.garantieExpireLe, in30Str),
      )
    );

  if (expiringClients.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  const [admin] = await db.select({ id: admins.id }).from(admins).limit(1);
  if (!admin) return NextResponse.json({ processed: 0 });

  for (const c of expiringClients) {
    const expDate = c.garantieExpireLe ? new Date(c.garantieExpireLe).toLocaleDateString("fr-FR") : "";
    await db.insert(notifications).values({
      id:      createId(),
      adminId: admin.id,
      type:    "garantie_expiration",
      titre:   `Garantie expire bientôt — ${c.name}`,
      contenu: `Expire le ${expDate}. Proposez un contrat d'entretien.`,
      refType: "client",
      refId:   c.id,
    });
  }

  return NextResponse.json({ processed: expiringClients.length });
}
