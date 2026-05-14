import { NextRequest, NextResponse } from "next/server";
import { getClients, createClient, updateClient, deleteClient } from "@/lib/clients";

export async function GET() {
  try {
    const data = await getClients();
    return NextResponse.json({ clients: data });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.phone) {
      return NextResponse.json({ error: "Nom et téléphone requis" }, { status: 400 });
    }
    const client = await createClient(body);
    return NextResponse.json({ client }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    const client = await updateClient(id, data);
    if (!client) return NextResponse.json({ error: "Client introuvable" }, { status: 404 });
    return NextResponse.json({ client });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    await deleteClient(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
