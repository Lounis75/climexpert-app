import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME, verifyCommercialToken, COMMERCIAL_COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { revuesDevis, notifications, leads, suivis } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { r2PutFile } from "@/lib/r2";
import { randomBytes } from "crypto";
import { resolveLeadId } from "@/lib/chiffrage-server";
import type { ChiffrageClient } from "@/lib/catalogue";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

const IMAGES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

// Le demandeur peut être un administrateur OU un commercial (celui qui a fait le chiffrage).
async function requester() {
  const c = await cookies();
  const at = c.get(COOKIE_NAME)?.value;
  const admin = at ? await verifyAdminToken(at) : null;
  if (admin) return { id: admin.sub, nom: admin.nom };
  const ct = c.get(COMMERCIAL_COOKIE_NAME)?.value;
  const com = ct ? await verifyCommercialToken(ct) : null;
  if (com) return { id: com.sub, nom: com.name };
  return null;
}

// Crée une demande d'avis d'expert : snapshot du devis (lignes, client) + photos de l'installation
// (obligatoires). Notifie les administrateurs. N'envoie RIEN au client à ce stade.
export async function POST(req: NextRequest) {
  const who = await requester();
  if (!who) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const form = await req.formData();
  let payload: Record<string, unknown>;
  try { payload = JSON.parse(String(form.get("payload") ?? "{}")); }
  catch { return NextResponse.json({ error: "Données invalides" }, { status: 400 }); }

  const lignes = Array.isArray(payload.lignes) ? payload.lignes : [];
  if (lignes.length === 0) return NextResponse.json({ error: "Aucune ligne de devis à faire relire." }, { status: 400 });

  // Photos obligatoires (au moins 1)
  const files = form.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return NextResponse.json({ error: "Ajoutez au moins une photo de l'installation." }, { status: 400 });

  const client = (payload.client ?? {}) as Record<string, string>;
  const clientType = payload.clientType === "pro" ? "pro" : "particulier";

  // Rattacher (ou créer) le prospect pour pouvoir lui envoyer le devis après validation.
  let leadId: string | null = null;
  try {
    const { id } = await resolveLeadId(payload.leadId as string | undefined, client as unknown as ChiffrageClient, clientType, { clientId: payload.clientId as string | undefined, project: payload.project as string | undefined });
    leadId = id;
  } catch (e) { logError("revue.resolveLead", e); }

  // Upload des photos sur R2
  const urls: string[] = [];
  for (const f of files.slice(0, 12)) {
    if (!IMAGES.includes(f.type)) continue;
    if (f.size > 12 * 1024 * 1024) continue;
    try {
      const ext = f.type.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
      const key = `revues/${randomBytes(6).toString("hex")}.${ext}`;
      urls.push(await r2PutFile(key, Buffer.from(await f.arrayBuffer()), f.type));
    } catch (e) { logError("revue.photo", e); }
  }
  if (urls.length === 0) return NextResponse.json({ error: "Les photos n'ont pas pu être envoyées, réessayez." }, { status: 502 });

  let revueId: string;
  try {
    const [r] = await db.insert(revuesDevis).values({
      leadId,
      clientId: (payload.clientId as string) ?? null,
      clientType,
      project: (payload.project as string) ?? null,
      description: (payload.description as string) ?? null,
      lignes,
      clientSnapshot: client,
      photosUrls: urls,
      noteDemande: String(payload.note ?? "").slice(0, 2000) || null,
      demandeParId: who.id,
      demandeParNom: who.nom,
      status: "en_attente",
    }).returning({ id: revuesDevis.id });
    revueId = r.id;
  } catch (e) {
    logError("revue.insert", e);
    return NextResponse.json({ error: "Échec de l'enregistrement de la demande." }, { status: 500 });
  }

  // Nom du client pour la notification
  let clientNom = client.nom || "";
  if (!clientNom && leadId) {
    const [l] = await db.select({ name: leads.name }).from(leads).where(eq(leads.id, leadId)).limit(1);
    clientNom = l?.name ?? "";
  }

  await db.insert(notifications).values({
    type: "revue_devis",
    titre: `Avis expert demandé : devis ${clientNom || "client"}`,
    contenu: `${who.nom} demande une relecture avant envoi${clientNom ? ` (${clientNom})` : ""}. ${urls.length} photo(s) jointe(s).`,
    refType: "revue", refId: revueId,
  }).catch((e) => logError("revue.notif", e));

  if (leadId) {
    await db.insert(suivis).values({ leadId, type: "note", contenu: `Avis d'expert demandé avant envoi du devis (par ${who.nom}), ${urls.length} photo(s) jointe(s).` }).catch(() => {});
  }

  return NextResponse.json({ ok: true, id: revueId });
}
