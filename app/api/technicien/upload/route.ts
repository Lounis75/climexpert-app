import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { verifyTechnicienToken, TECH_COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(TECH_COOKIE_NAME)?.value;
  const session = token ? await verifyTechnicienToken(token) : null;
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  // Limite 5 MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["jpg", "jpeg", "png", "webp"].includes(ext ?? "")) {
    return NextResponse.json({ error: "Format non supporté (JPEG/PNG/WebP)" }, { status: 400 });
  }

  const filename = `rapports/${session.sub}/${Date.now()}.${ext}`;
  const blob = await put(filename, file, { access: "public" });

  return NextResponse.json({ url: blob.url });
}
