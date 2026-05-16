import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { savTickets, clients, notifications, admins } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

async function getAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  return token ? verifyAdminToken(token) : null;
}

export async function GET(req: NextRequest) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");

  const rows = await db
    .select({
      id:             savTickets.id,
      status:         savTickets.status,
      subject:        savTickets.subject,
      description:    savTickets.description,
      clientId:       savTickets.clientId,
      interventionId: savTickets.interventionId,
      createdAt:      savTickets.createdAt,
      updatedAt:      savTickets.updatedAt,
      clientName:     clients.name,
      clientPhone:    clients.phone,
    })
    .from(savTickets)
    .leftJoin(clients, eq(savTickets.clientId, clients.id))
    .where(status ? eq(savTickets.status, status as "ouvert" | "en_cours" | "résolu" | "fermé") : undefined)
    .orderBy(desc(savTickets.createdAt));

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { clientId, interventionId, subject, description } = body;

  if (!clientId || !subject) {
    return NextResponse.json({ error: "clientId et subject requis" }, { status: 400 });
  }

  const [ticket] = await db
    .insert(savTickets)
    .values({ id: createId(), clientId, interventionId: interventionId || null, subject, description: description || null })
    .returning();

  // Notification admin
  const [admin] = await db.select({ id: admins.id }).from(admins).limit(1);
  if (admin) {
    await db.insert(notifications).values({
      id: createId(),
      adminId: admin.id,
      type: "ticket_sav",
      titre: `Nouveau ticket SAV : ${subject}`,
      contenu: description || null,
      refType: "sav",
      refId: ticket.id,
    });
  }

  return NextResponse.json(ticket, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json();
  const { id, status } = body;
  if (!id || !status) return NextResponse.json({ error: "id et status requis" }, { status: 400 });

  const [updated] = await db
    .update(savTickets)
    .set({ status, updatedAt: new Date() })
    .where(eq(savTickets.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const session = await getAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  await db.delete(savTickets).where(eq(savTickets.id, id));
  return NextResponse.json({ ok: true });
}
