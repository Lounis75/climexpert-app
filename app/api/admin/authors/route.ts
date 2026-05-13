import { NextRequest, NextResponse } from "next/server";
import { getAuthors, createAuthor, updateAuthor, deleteAuthor } from "@/lib/authors";

function isAuthed(req: NextRequest): boolean {
  const token = req.cookies.get("admin_token")?.value;
  return token === process.env.ADMIN_SECRET;
}

export async function GET(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const authors = await getAuthors();
  return NextResponse.json(authors);
}

export async function POST(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const { name, role, photo, bio } = body;
  if (!name?.trim() || !role?.trim()) {
    return NextResponse.json({ error: "Nom et rôle requis" }, { status: 400 });
  }
  const author = await createAuthor({ name: name.trim(), role: role.trim(), photo, bio: bio?.trim() });
  return NextResponse.json(author, { status: 201 });
}

export async function PUT(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json();
  const { id, ...data } = body;
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
  const updated = await updateAuthor(id, data);
  if (!updated) return NextResponse.json({ error: "Auteur introuvable" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  if (!isAuthed(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });
  await deleteAuthor(id);
  return NextResponse.json({ ok: true });
}
