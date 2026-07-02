import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, notifications } from "@/lib/db/schema";
import { and, isNull, lte, gte, isNotNull, eq } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";
import { logError } from "@/lib/observability";

// Cron quotidien : garanties qui expirent dans les 30 jours. Notifie UNE SEULE FOIS par
// client (garantieNotifieeLe), sinon la cloche recevait la même alerte chaque jour
// pendant 30 jours.
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
        isNull(clients.garantieNotifieeLe), // pas encore alerté pour cette garantie
      )
    );

  if (expiringClients.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;
  for (const c of expiringClients) {
    try {
      const expDate = c.garantieExpireLe
        ? new Date(c.garantieExpireLe).toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })
        : "";
      await db.insert(notifications).values({
        id:      createId(),
        adminId: null,
        type:    "garantie_expiration",
        titre:   `Garantie expire bientôt, ${c.name}`,
        contenu: `Expire le ${expDate}. Proposez un contrat d'entretien.`,
        refType: "client",
        refId:   c.id,
      });
      await db.update(clients).set({ garantieNotifieeLe: new Date() }).where(eq(clients.id, c.id));
      processed++;
    } catch (e) {
      logError("cron.garanties", e, { clientId: c.id });
    }
  }

  return NextResponse.json({ processed });
}
