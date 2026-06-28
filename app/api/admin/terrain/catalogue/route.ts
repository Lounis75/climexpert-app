import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { getCatalogue, saveCatalogue, type Catalogue } from "@/lib/catalogue";

async function getSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token ? verifyAdminToken(token) : null;
}

// Catalogue de prix du chiffrage terrain (lecture).
export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json({ catalogue: await getCatalogue() });
}

// Sauvegarde du catalogue (admin uniquement).
export async function PUT(req: NextRequest) {
  if (!(await getSession())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  const c = body as Catalogue;
  if (!Array.isArray(c.brands) || typeof c.equip !== "object" || typeof c.annex !== "object") {
    return NextResponse.json({ error: "Catalogue incomplet" }, { status: 400 });
  }
  try {
    await saveCatalogue({
      brands: c.brands,
      equip: c.equip,
      annex: c.annex,
      moRate: Number(c.moRate) || 150,
      marginCoeff: Number(c.marginCoeff) || 1.265,
    });
  } catch (e) {
    console.error("[catalogue PUT]", e);
    return NextResponse.json({ error: "Échec de l'enregistrement" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, catalogue: await getCatalogue() });
}
