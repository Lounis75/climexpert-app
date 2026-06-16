import { NextRequest, NextResponse } from "next/server";
import { r2PutFile } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: "Format non supporté (JPEG, PNG, WebP)" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 MB)" }, { status: 400 });
  }

  const ext = file.type.split("/")[1] ?? "jpg";
  const key = `articles/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await r2PutFile(key, buffer, file.type);
  return NextResponse.json({ url });
}
