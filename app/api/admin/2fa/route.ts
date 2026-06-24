import { NextRequest, NextResponse } from "next/server";
import speakeasy from "speakeasy";
import { db } from "@/lib/db";
import { admins } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";

// Reconfiguration du 2FA (Google Authenticator) du compte admin CONNECTÉ.
// "generate" : crée un nouveau secret (non enregistré) + renvoie le QR.
// "confirm"  : vérifie un code issu du nouveau QR puis enregistre le secret (remplace l'ancien).
// On ne sauvegarde qu'APRÈS une vérification réussie → aucun risque de se verrouiller.
async function getAdmin(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : null;
}

export async function POST(req: NextRequest) {
  const session = await getAdmin(req);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  if (body.action === "generate") {
    const s = speakeasy.generateSecret({ name: `ClimExpert Admin (${session.email})`, length: 20 });
    return NextResponse.json({ otpauthUrl: s.otpauth_url ?? "", totpSecret: s.base32 });
  }

  if (body.action === "confirm") {
    const { secret, code } = body;
    if (!secret || !code) return NextResponse.json({ error: "Code requis" }, { status: 400 });
    const valid = speakeasy.totp.verify({ secret, encoding: "base32", token: String(code).trim(), window: 1 });
    if (!valid) {
      return NextResponse.json({ error: "Code invalide. Vérifiez que le QR a bien été scanné et que l'heure du téléphone est correcte." }, { status: 400 });
    }
    await db.update(admins).set({ totpSecret: secret }).where(eq(admins.id, session.sub));
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}
