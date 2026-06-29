import { NextRequest, NextResponse } from "next/server";
import { getInterventionById, TYPE_LABELS } from "@/lib/interventions";
import { getClientById } from "@/lib/clients";
import { getTechnicienById } from "@/lib/techniciens";
import { generateOrdreMissionPDF } from "@/lib/ordre-mission-pdf";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const i = await getInterventionById(id);
    if (!i) return NextResponse.json({ error: "Intervention introuvable" }, { status: 404 });

    const [client, tech] = await Promise.all([
      i.clientId ? getClientById(i.clientId) : Promise.resolve(null),
      i.technicienId ? getTechnicienById(i.technicienId) : Promise.resolve(null),
    ]);

    // Créneau lisible
    const start = i.scheduledAt ? new Date(i.scheduledAt) : null;
    const dureeMin = i.dureeEstimeeMinutes ?? 0;
    const fmtT = (d: Date) => d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
    let creneau = "-";
    if (start) {
      const jour = start.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });
      const fin = dureeMin > 0 ? ` – ${fmtT(new Date(start.getTime() + dureeMin * 60000))}` : "";
      creneau = `${jour} · ${fmtT(start)}${fin}`;
    }
    const duree = dureeMin > 0 ? `${Math.floor(dureeMin / 60)}h${dureeMin % 60 ? String(dureeMin % 60).padStart(2, "0") : ""}` : null;

    const pdf = await generateOrdreMissionPDF({
      reference: id.slice(-6).toUpperCase(),
      dateEdition: new Date().toLocaleDateString("fr-FR"),
      sousTraitant: tech ? { nom: tech.name, entreprise: tech.entreprise, specialite: tech.specialite } : null,
      type: TYPE_LABELS[i.type] ?? i.type,
      dateCreneau: creneau,
      duree,
      lieu: i.address || i.clientAddress || "",
      siteNom: i.siteNom,
      client: {
        nom: i.clientName ?? client?.name ?? "-",
        phone: i.clientPhone ?? client?.phone,
        email: i.clientEmail ?? client?.email,
      },
      notes: i.notes,
      besoins: client?.notes,
    });

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ordre-mission-${id.slice(-6)}.pdf"`,
      },
    });
  } catch (e) {
    console.error("[ordre-mission]", e);
    return NextResponse.json({ error: "Échec de génération du PDF" }, { status: 500 });
  }
}
