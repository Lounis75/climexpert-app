import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { ensureQualifToken, qualifLink } from "@/lib/qualif";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

// Génère (ou réutilise) le lien personnel de qualification Alex pour un prospect, et renvoie un SMS
// prêt à copier-coller. Le gérant l'envoie depuis son propre téléphone (gratuit).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const { id } = await params;

  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });

  const token = await ensureQualifToken(id, lead.qualifToken);
  const link = qualifLink(token);
  const prenom = (lead.name || "").trim().split(" ")[0] || "";
  const sms = `Bonjour${prenom ? ` ${prenom}` : ""}, c'est Alex de ClimExpert. Suite à votre appel et à un afflux de demandes, on met tout en œuvre pour vous répondre au plus vite. Pour gagner du temps, décrivez votre besoin en 2 minutes ici, je vous donnerai une première estimation : ${link} À très vite !`;

  return NextResponse.json({ token, link, sms, phone: lead.phone ?? "" });
}
