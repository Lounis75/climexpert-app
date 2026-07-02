import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { r2PutFile } from "@/lib/r2";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";

// Upload utilisé par : les formulaires PUBLICS (calculateur / demande de devis → photos) ET
// l'admin (joindre un PDF de devis). On distingue les deux :
//  - public (non authentifié) : images uniquement (pas de PDF = vecteur de phishing) + limite par IP ;
//  - admin authentifié : tout autorisé (PDF compris), sans limite.
const IMAGES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export async function POST(req: NextRequest) {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const isAdmin = token ? !!(await verifyAdminToken(token)) : false;

  if (!isAdmin) {
    // Anti-abus : limite les uploads anonymes (évite le remplissage du stockage et l'hébergement
    // de contenu arbitraire sous nos URLs). 15 fichiers / 10 min / IP.
    if (!(await rateLimit(`upload-devis:${clientIp(req)}`, 15, 10 * 60 * 1000))) {
      return NextResponse.json({ error: "Trop d'envois, réessayez dans quelques minutes." }, { status: 429 });
    }
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

  const allowed = isAdmin ? [...IMAGES, "application/pdf"] : IMAGES;
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: isAdmin ? "Format non supporté (JPEG, PNG, WebP, HEIC, PDF)" : "Format non supporté (image uniquement)" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Fichier trop volumineux (max 10 Mo)" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const key = `devis-photos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const url = await r2PutFile(key, buffer, file.type);
  return NextResponse.json({ url });
}
