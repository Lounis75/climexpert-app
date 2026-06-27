import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { r2PutFile } from "@/lib/r2";

// Pièces jointes internes d'un prospect (photos + PDF), propres au dossier du lead.
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "image/gif", "application/pdf"];

async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : null;
}

async function getPieces(id: string): Promise<string[]> {
  const [row] = await db.select({ p: leads.piecesJointes }).from(leads).where(eq(leads.id, id));
  return row?.p ?? [];
}

// Ajoute une pièce jointe au dossier du prospect.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (JPEG, PNG, WebP, HEIC, PDF)" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";
  const key = `lead-pieces/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await r2PutFile(key, buffer, file.type);

  const pieces = await getPieces(id);
  pieces.push(url);
  // Pas de bump de version : évite un faux conflit 409 côté panneau (verrou optimiste).
  await db.update(leads).set({ piecesJointes: pieces, updatedAt: new Date() }).where(eq(leads.id, id));
  return NextResponse.json({ pieces });
}

// Retire une pièce jointe.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getSession())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;
  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url manquante" }, { status: 400 });
  const pieces = (await getPieces(id)).filter((p) => p !== url);
  await db.update(leads).set({ piecesJointes: pieces, updatedAt: new Date() }).where(eq(leads.id, id));
  return NextResponse.json({ pieces });
}
