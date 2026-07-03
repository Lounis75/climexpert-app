import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { leads, suivis } from "@/lib/db/schema";
import { and, eq, isNull, sql } from "drizzle-orm";
import { r2PutFile } from "@/lib/r2";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { randomBytes } from "crypto";
import { logError } from "@/lib/observability";
import { qualifTokenValid } from "@/lib/qualif";

export const runtime = "nodejs";

const IMAGES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// PUBLIC (protégé par le jeton de qualif) : le prospect ajoute une photo depuis le portail, elle est
// stockée sur R2 et rattachée à SA fiche (leads.photos_urls), visible par l'équipe.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!(await rateLimit(`qualif-photo:${clientIp(req)}`, 30, 10 * 60 * 1000))) {
    return NextResponse.json({ error: "Trop d'envois, réessayez dans quelques minutes." }, { status: 429 });
  }

  const [lead] = await db.select().from(leads).where(and(eq(leads.qualifToken, token), isNull(leads.supprimeLe))).limit(1);
  if (!lead || !qualifTokenValid(lead.qualifTokenLe)) return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Aucun fichier reçu" }, { status: 400 });
  if (!IMAGES.includes(file.type)) return NextResponse.json({ error: "Photo uniquement (JPEG, PNG, HEIC…)." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Photo trop lourde (10 Mo maximum)." }, { status: 400 });

  try {
    const ext = file.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const key = `qualif/${lead.id}-${randomBytes(6).toString("hex")}.${ext}`;
    const url = await r2PutFile(key, Buffer.from(await file.arrayBuffer()), file.type);
    await db.update(leads).set({
      photosUrls: sql`array_append(${leads.photosUrls}, ${url})`,
      updatedAt: new Date(),
    }).where(eq(leads.id, lead.id));
    await db.insert(suivis).values({ leadId: lead.id, type: "note", contenu: "Photo ajoutée par le client via le portail de qualification." }).catch(() => {});
    return NextResponse.json({ ok: true, url });
  } catch (e) {
    logError("qualif.photo", e, { leadId: lead.id });
    return NextResponse.json({ error: "Échec de l'envoi de la photo, réessayez." }, { status: 500 });
  }
}
