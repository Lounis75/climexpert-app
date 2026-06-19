import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { interventions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { r2PutFile } from "@/lib/r2";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

async function getPhotos(id: string): Promise<string[]> {
  const [row] = await db.select({ p: interventions.photosBriefing }).from(interventions).where(eq(interventions.id, id));
  if (!row) return [];
  try { return row.p ? (JSON.parse(row.p) as string[]) : []; } catch { return []; }
}

// Ajoute une photo de briefing (admin → aide le technicien).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (JPEG, PNG, WebP, HEIC)" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `intervention-briefing/${id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await r2PutFile(key, buffer, file.type);

  const photos = await getPhotos(id);
  photos.push(url);
  await db.update(interventions)
    .set({ photosBriefing: JSON.stringify(photos), updatedAt: new Date() })
    .where(eq(interventions.id, id));
  return NextResponse.json({ photos });
}

// Retire une photo de briefing.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url).searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url manquante" }, { status: 400 });
  const photos = (await getPhotos(id)).filter((p) => p !== url);
  await db.update(interventions)
    .set({ photosBriefing: JSON.stringify(photos), updatedAt: new Date() })
    .where(eq(interventions.id, id));
  return NextResponse.json({ photos });
}
