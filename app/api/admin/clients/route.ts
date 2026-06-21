import { NextRequest, NextResponse } from "next/server";
import { getClients, getClientsPaginated, getClientActions, createClient, updateClient, deleteClient } from "@/lib/clients";
import { logError } from "@/lib/observability";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Sans paramètre "page" → liste complète (rétro-compat : menus déroulants, calendrier).
    if (!searchParams.has("page")) {
      const data = await getClients();
      return NextResponse.json({ clients: data });
    }
    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 50;
    const search = searchParams.get("q") ?? "";
    const { items, total, pageSize } = await getClientsPaginated({ search, page, limit });
    const actions = await getClientActions(items);
    return NextResponse.json({ clients: items, total, page, pageSize, actions });
  } catch (e) {
    logError("clients.GET", e);
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
