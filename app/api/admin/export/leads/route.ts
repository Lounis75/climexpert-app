import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { desc, like, eq } from "drizzle-orm";

function escapeCsv(v: string | null | undefined): string {
  if (v == null) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status  = searchParams.get("status");
  const project = searchParams.get("project");

  let query = db.select().from(leads).$dynamic();
  if (status)  query = query.where(eq(leads.status, status as never));
  if (project) query = query.where(eq(leads.project, project as never));
  query = query.orderBy(desc(leads.createdAt));

  const rows = await query;

  const headers = ["ID", "Nom", "Téléphone", "Email", "Projet", "Surface m²", "Localisation", "Statut", "Source", "Créé le"];
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        escapeCsv(r.id),
        escapeCsv(r.name),
        escapeCsv(r.phone),
        escapeCsv(r.email),
        escapeCsv(r.project),
        escapeCsv(r.surfaceM2 != null ? String(r.surfaceM2) : null),
        escapeCsv(r.location),
        escapeCsv(r.status),
        escapeCsv(r.source),
        escapeCsv(new Date(r.createdAt).toLocaleDateString("fr-FR")),
      ].join(","),
    ),
  ];

  return new NextResponse(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
