import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { clients, factures } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

function escapeCsv(v: string | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET() {
  const [allClients, allFactures] = await Promise.all([
    db.select().from(clients).orderBy(desc(clients.createdAt)),
    db.select({ clientId: factures.clientId, totalTtcCt: factures.totalTtcCt, status: factures.status }).from(factures),
  ]);

  const caByClient: Record<string, number> = {};
  for (const f of allFactures) {
    if (f.status === "payée" && f.clientId) {
      caByClient[f.clientId] = (caByClient[f.clientId] ?? 0) + (f.totalTtcCt ?? 0);
    }
  }

  const headers = ["ID", "Nom", "Téléphone", "Email", "Adresse", "Ville", "Équipement", "Marque/Modèle", "Date installation", "Garantie expire", "CA encaissé (€)", "Créé le"];
  const lines = [
    headers.join(","),
    ...allClients.map((c) =>
      [
        escapeCsv(c.id),
        escapeCsv(c.name),
        escapeCsv(c.phone),
        escapeCsv(c.email),
        escapeCsv(c.address),
        escapeCsv(c.city),
        escapeCsv(c.equipementInstalle),
        escapeCsv(c.marqueModele),
        escapeCsv(c.dateInstallation ? new Date(c.dateInstallation).toLocaleDateString("fr-FR") : null),
        escapeCsv(c.garantieExpireLe ? new Date(c.garantieExpireLe).toLocaleDateString("fr-FR") : null),
        escapeCsv(((caByClient[c.id] ?? 0) / 100).toFixed(2)),
        escapeCsv(new Date(c.createdAt).toLocaleDateString("fr-FR")),
      ].join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clients-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
