import { NextRequest, NextResponse } from "next/server";
import { r2PutFile } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", "application/pdf"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (JPEG, PNG, WebP, HEIC, PDF)" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `devis-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await r2PutFile(key, buffer, file.type);
  return NextResponse.json({ url });
}
