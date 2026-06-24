import { NextRequest, NextResponse } from "next/server";
import { r2PutFile } from "@/lib/r2";
import { verifyTechnicienToken, TECH_COOKIE_NAME, verifyAdminToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(req: NextRequest) {
  // Upload autorisé au technicien OU à l'admin (clôture depuis le back-office).
  const techToken = req.cookies.get(TECH_COOKIE_NAME)?.value;
  const techSession = techToken ? await verifyTechnicienToken(techToken) : null;
  let actorId: string | null = techSession?.sub ?? null;
  if (!actorId) {
    const adminToken = req.cookies.get(COOKIE_NAME)?.value;
    const adminSession = adminToken ? await verifyAdminToken(adminToken) : null;
    actorId = adminSession?.sub ?? null;
  }
  if (!actorId) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 5 MB)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase();
  if (!["jpg", "jpeg", "png", "webp"].includes(ext ?? "")) {
    return NextResponse.json({ error: "Format non supporté (JPEG/PNG/WebP)" }, { status: 400 });
  }

  const key = `rapports/${actorId}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await r2PutFile(key, buffer, file.type);
  return NextResponse.json({ url });
}
