import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { db } from "@/lib/db";
import { leads, suivis, devisEnvois } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { createElement } from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { Resend } from "resend";
import DevisPDF from "@/components/pdf/DevisPDF";
import { generateDevisNumber } from "@/lib/devis";
import { r2PutFile } from "@/lib/r2";
import { resolveLeadId } from "@/lib/chiffrage-server";
import { logError } from "@/lib/observability";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

type RawLine = { d: string; q: number; pu: number; tva: number };

// Génère le PDF du devis à partir du chiffrage, l'envoie au client et bascule le prospect en
// "devis_envoyé" (réutilise exactement le flux existant : R2 + devisEnvois + e-mail + statut).
export async function POST(req: NextRequest) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const client = body.client ?? {};
  const rawLines: RawLine[] = Array.isArray(body.lignes) ? body.lignes : [];
  const message = String(body.message ?? "").trim();
  const clientType = body.clientType === "pro" ? "pro" : "particulier";
  if (rawLines.length === 0) return NextResponse.json({ error: "Aucune ligne de devis." }, { status: 400 });

  // 1) Prospect (existant ou créé), e-mail requis pour l'envoi
  const { id } = await resolveLeadId(body.leadId, client, clientType);
  const [lead] = await db.select().from(leads).where(eq(leads.id, id)).limit(1);
  if (!lead) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  const email = (lead.email || client.email || "").trim();
  if (!email) return NextResponse.json({ error: "Renseigne l'e-mail du client pour pouvoir lui envoyer le devis." }, { status: 400 });

  // 2) Lignes + totaux (centimes)
  const lignes = rawLines.map((ln, i) => ({
    id: String(i),
    designation: String(ln.d ?? ""),
    quantite: Number(ln.q) || 0,
    prixUnitaireCt: Math.round((Number(ln.pu) || 0) * 100),
    tvaRate: String(ln.tva ?? "10"),
  }));
  let totalHtCt = 0, totalTtcCt = 0;
  for (const l of lignes) { const ht = l.quantite * l.prixUnitaireCt; totalHtCt += ht; totalTtcCt += ht + Math.round(ht * (parseFloat(l.tvaRate) / 100)); }
  const montantCt = totalTtcCt;

  // 3) PDF du devis (même composant que le reste du CRM)
  let buf: Buffer;
  let number: string;
  try {
    number = await generateDevisNumber();
    const created = new Date();
    const valid = new Date(created.getTime() + 30 * 86400000);
    const pdf = await renderToBuffer(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createElement(DevisPDF as any, {
        number, createdAt: created.toISOString(), validUntil: valid.toISOString(),
        clientName: lead.name, description: null, lignes, totalHtCt, totalTtcCt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
    buf = Buffer.from(pdf);
  } catch (e) {
    logError("chiffrage.pdf", e, { leadId: id });
    return NextResponse.json({ error: "Échec de la génération du PDF." }, { status: 500 });
  }

  // 4) Stockage R2
  const key = `devis/${id}-${randomBytes(6).toString("hex")}.pdf`;
  let url: string;
  try { url = await r2PutFile(key, buf, "application/pdf"); }
  catch (e) { logError("chiffrage.r2", e, { leadId: id }); return NextResponse.json({ error: "Échec du stockage du PDF." }, { status: 500 }); }

  // 5) E-mail avec lien de décision
  const token = randomBytes(32).toString("hex");
  const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://climexpert.fr";
  const link = `${baseUrl}/mon-devis/${token}`;
  const montantTxt = `${(montantCt / 100).toLocaleString("fr-FR")} €`;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "ClimExpert <noreply@climexpert.fr>",
      to: process.env.EMAIL_TEST_OVERRIDE || email,
      subject: "Votre devis ClimExpert",
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#0f172a;">Bonjour ${lead.name},</h2>
        <p>Suite à notre échange, vous trouverez ci-joint votre <strong>devis</strong> d'un montant de <strong>${montantTxt}</strong>.</p>
        ${message ? `<p>${message.replace(/\n/g, "<br>")}</p>` : ""}
        <p>Pour <strong>valider</strong> ou <strong>décliner</strong> votre devis, c'est en 1 clic :</p>
        <p><a href="${link}" style="background:#0ea5e9;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:bold;">Voir mon devis et répondre</a></p>
        <p style="color:#64748b;font-size:12px;">Lien personnel, merci de ne pas le transférer.</p>
        <p style="color:#94a3b8;font-size:12px;">L'équipe ClimExpert<br>contact@climexpert.fr</p>
      </div>`,
      attachments: [{ filename: `${number}.pdf`, content: buf }],
    });
  } catch (e) {
    logError("chiffrage.email", e, { leadId: id });
    return NextResponse.json({ error: "Échec de l'envoi de l'e-mail au client." }, { status: 500 });
  }

  // 6) Bascule du prospect en "devis_envoyé" + nettoyage du brouillon
  await db.update(leads).set({
    devisUrl: url, devisNomFichier: `${number}.pdf`, devisEnvoyeLe: new Date(), devisToken: token,
    devisDecision: null, devisDecisionLe: null, devisMotifRefus: null,
    montantDevisCt: montantCt, status: "devis_envoyé", statutChangeLe: new Date(), relanceNotifieeLe: null,
    chiffrageBrouillon: null,
    ...(!lead.email && email ? { email } : {}),
    version: sql`${leads.version} + 1`, updatedAt: new Date(),
  }).where(eq(leads.id, id));

  await db.insert(devisEnvois).values({ leadId: id, url, nomFichier: `${number}.pdf`, token, montantCt, envoyeLe: new Date() })
    .catch((e) => logError("chiffrage.envoi.insert", e, { leadId: id }));
  await db.insert(suivis).values({ leadId: id, type: "devis", contenu: `Devis envoyé au client (${montantTxt}) depuis le chiffrage terrain, en attente de sa réponse.` }).catch(() => {});

  return NextResponse.json({ ok: true, leadId: id });
}
