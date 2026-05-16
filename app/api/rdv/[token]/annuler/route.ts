import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interventions, clients, notifications, admins } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { Resend } from "resend";
import { createId } from "@paralleldrive/cuid2";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const { motif } = await req.json().catch(() => ({ motif: "" }));

  const [interv] = await db
    .select()
    .from(interventions)
    .where(and(eq(interventions.rdvToken, token), isNull(interventions.supprimeLe)))
    .limit(1);

  if (!interv) return NextResponse.json({ error: "token_invalide" }, { status: 404 });
  if (interv.status === "annulée") return NextResponse.json({ error: "annulee" }, { status: 410 });

  await db
    .update(interventions)
    .set({ status: "annulée", annulePar: "client", motifAnnulation: motif || null, updatedAt: new Date() })
    .where(eq(interventions.id, interv.id));

  const [client] = await db.select().from(clients).where(eq(clients.id, interv.clientId)).limit(1);

  // Notif admin
  const [admin] = await db.select({ id: admins.id }).from(admins).limit(1);
  if (admin) {
    await db.insert(notifications).values({
      id: createId(), adminId: admin.id, type: "annulation",
      titre: `Annulation client — ${client?.name ?? "inconnu"}`,
      contenu: motif || "Aucun motif fourni",
      refType: "intervention", refId: interv.id,
    });
  }

  // Notif technicien
  if (interv.technicienId) {
    await db.insert(notifications).values({
      id: createId(), adminId: interv.technicienId, type: "annulation",
      titre: "Intervention annulée par le client",
      contenu: motif || "Aucun motif fourni",
      refType: "intervention", refId: interv.id,
    });
  }

  return NextResponse.json({ ok: true });
}
