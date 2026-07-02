import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import { createOffre, updateOffre, deleteOffre, getOffres, CONTRATS } from "@/lib/emplois";
import { logError } from "@/lib/observability";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

async function session() {
  const t = (await cookies()).get(COOKIE_NAME)?.value;
  return t ? verifyAdminToken(t) : null;
}

function cleanContrat(c: unknown): string {
  return (CONTRATS as readonly string[]).includes(String(c)) ? String(c) : "CDI";
}

export async function GET() {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  return NextResponse.json({ offres: await getOffres() });
}

export async function POST(req: NextRequest) {
  if (!(await session())) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  // Après toute modification d'offre, on purge le cache ISR de la page publique (mise à jour
  // immédiate au lieu d'attendre la revalidation de 5 min).
  const done = (offres: unknown) => { revalidatePath("/recrutement"); return NextResponse.json({ offres }); };

  try {
    if (body.action === "create" || body.action === "update") {
      const data = {
        titre: String(body.titre ?? "").slice(0, 200),
        resume: body.resume != null ? String(body.resume).slice(0, 300) : null,
        contrat: cleanContrat(body.contrat),
        lieu: String(body.lieu ?? "Île-de-France").slice(0, 120),
        description: String(body.description ?? "").slice(0, 6000),
        profil: body.profil != null ? String(body.profil).slice(0, 4000) : null,
        actif: body.actif !== false,
        ordre: Number.isFinite(Number(body.ordre)) ? Math.round(Number(body.ordre)) : 0,
      };
      if (!data.titre.trim() || !data.description.trim()) {
        return NextResponse.json({ error: "Titre et description sont requis." }, { status: 400 });
      }
      if (body.action === "update") {
        if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
        await updateOffre(String(body.id), data);
      } else {
        await createOffre(data);
      }
      return done(await getOffres());
    }
    if (body.action === "toggle") {
      if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
      await updateOffre(String(body.id), { actif: body.actif === true });
      return done(await getOffres());
    }
    if (body.action === "delete") {
      if (!body.id) return NextResponse.json({ error: "id requis" }, { status: 400 });
      await deleteOffre(String(body.id));
      return done(await getOffres());
    }
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (e) {
    logError("recrutement.admin", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
