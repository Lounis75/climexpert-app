import { NextRequest, NextResponse } from "next/server";
import { getContrats, createContrat, updateContrat, deleteContrat } from "@/lib/contrats";

export async function GET() {
  try {
    const list = await getContrats();
    return NextResponse.json({ contrats: list });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.clientId || !body.startDate) {
      return NextResponse.json({ error: "Client et date de début requis" }, { status: 400 });
    }
    const c = await createContrat({
      clientId: body.clientId,
      units: Number(body.units ?? 1),
      prixUnitaireCt: Math.round(Number(body.prixUnitaireEuros ?? 200) * 100),
      startDate: body.startDate,
      nextVisit: body.nextVisit ?? undefined,
    });
    return NextResponse.json({ contrat: c }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const patch: Parameters<typeof updateContrat>[1] = {};
    if (body.units != null) patch.units = Number(body.units);
    if (body.prixUnitaireEuros != null) patch.prixUnitaireCt = Math.round(Number(body.prixUnitaireEuros) * 100);
    if (body.nextVisit !== undefined) patch.nextVisit = body.nextVisit;
    if (body.active !== undefined) patch.active = body.active;
    const c = await updateContrat(body.id, patch);
    return NextResponse.json({ contrat: c });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await deleteContrat(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
