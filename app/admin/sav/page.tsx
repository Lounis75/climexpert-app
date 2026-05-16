import { db } from "@/lib/db";
import { savTickets, clients } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import AdminHeader from "@/components/AdminHeader";
import SavManager from "./SavManager";

export const dynamic = "force-dynamic";

export default async function AdminSavPage() {
  const tickets = await db
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
    .orderBy(desc(savTickets.createdAt));

  const allClients = await db
    .select({ id: clients.id, name: clients.name })
    .from(clients)
    .orderBy(clients.name);

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">SAV</h1>
          <p className="text-slate-400 text-sm">
            Tickets de service après-vente et demandes de dépannage.
          </p>
        </div>
        <SavManager initialTickets={tickets} clients={allClients} />
      </main>
    </div>
  );
}
