import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, interventions, devis, factures, savTickets, suivisPlanifies, suivis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auditAction } from "@/lib/audit";

// Hard-delete all client personal data (RGPD right to erasure)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const [row] = await db.select({ id: clients.id }).from(clients).where(eq(clients.id, id)).limit(1);
  if (!row) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  // Delete dependent records first, then the client
  await db.delete(suivisPlanifies).where(eq(suivisPlanifies.clientId, id));
  await db.delete(savTickets).where(eq(savTickets.clientId, id));
  await db.delete(suivis).where(eq(suivis.clientId, id));
  await db.delete(interventions).where(eq(interventions.clientId, id));
  await db.delete(factures).where(eq(factures.clientId, id));
  await db.delete(devis).where(eq(devis.clientId, id));
  await db.delete(clients).where(eq(clients.id, id));
  await auditAction({
    action: "rgpd_delete_client",
    tableCible: "clients",
    idCible: id,
    ip: _req.headers.get("x-forwarded-for") ?? undefined,
  });

  return NextResponse.json({ ok: true, deleted: "client", id });
}
