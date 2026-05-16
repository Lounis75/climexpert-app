import { NextRequest, NextResponse } from "next/server";
import {
  getTechniciens, createTechnicien, updateTechnicien, deleteTechnicien,
} from "@/lib/techniciens";

export async function GET() {
  try {
    const list = await getTechniciens();
    return NextResponse.json({ techniciens: list });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.email) {
      return NextResponse.json({ error: "Nom et email requis" }, { status: 400 });
    }
    const t = await createTechnicien({
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      color: body.color ?? "#3b82f6",
    });
    return NextResponse.json({ technicien: t }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    const t = await updateTechnicien(body.id, {
      name: body.name,
      email: body.email,
      phone: body.phone,
      color: body.color,
      active: body.active,
    });
    return NextResponse.json({ technicien: t });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
    await deleteTechnicien(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
