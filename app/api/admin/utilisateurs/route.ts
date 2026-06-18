import { NextRequest, NextResponse } from "next/server";
import { getUtilisateurs, getUtilisateurByEmail, createUtilisateur, updateUtilisateur, deleteUtilisateur } from "@/lib/utilisateurs";
import { isValidRoleCombination, isRole } from "@/lib/roles";

export async function GET() {
  try {
    const list = await getUtilisateurs();
    // On n'expose jamais le hash de mot de passe au front
    const safe = list.map(({ passwordHash, totpSecret, ...u }) => ({
      ...u,
      hasAccess: !!passwordHash,
    }));
    return NextResponse.json({ utilisateurs: safe });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, nom, prenom, phone, roles, color } = body;
    if (!email?.trim() || !nom?.trim()) {
      return NextResponse.json({ error: "Email et nom requis" }, { status: 400 });
    }
    const cleanRoles: string[] = Array.isArray(roles) ? roles.filter(isRole) : [];
    if (!isValidRoleCombination(cleanRoles)) {
      return NextResponse.json(
        { error: "Combinaison de rôles invalide (un admin peut cumuler ; sinon un seul rôle)." },
        { status: 400 }
      );
    }
    const existing = await getUtilisateurByEmail(email);
    if (existing) return NextResponse.json({ error: "Un salarié avec cet email existe déjà" }, { status: 409 });

    const u = await createUtilisateur({ email, nom, prenom, phone, roles: cleanRoles, color });
    return NextResponse.json({ utilisateur: { ...u, passwordHash: undefined, totpSecret: undefined, hasAccess: false } }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

    const patch: Record<string, unknown> = {};
    if (typeof fields.nom === "string" && fields.nom.trim()) patch.nom = fields.nom.trim();
    if (fields.prenom !== undefined) patch.prenom = fields.prenom;
    if (fields.phone !== undefined) patch.phone = fields.phone;
    if (fields.color) patch.color = fields.color;
    if (typeof fields.email === "string" && fields.email.trim()) patch.email = fields.email;
    if (fields.actif !== undefined) patch.actif = fields.actif;
    if (Array.isArray(fields.roles)) {
      const cleanRoles = fields.roles.filter(isRole);
      if (!isValidRoleCombination(cleanRoles)) {
        return NextResponse.json({ error: "Combinaison de rôles invalide" }, { status: 400 });
      }
      patch.roles = cleanRoles;
    }
    const u = await updateUtilisateur(id, patch);
    if (!u) return NextResponse.json({ error: "Salarié introuvable" }, { status: 404 });
    return NextResponse.json({ utilisateur: { ...u, passwordHash: undefined, totpSecret: undefined, hasAccess: !!u.passwordHash } });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });
    await deleteUtilisateur(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
