import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { clearCookieOptions } from "@/lib/cookie";

// Chemins admin publics — correspondance EXACTE (et NON par préfixe) : sinon
// "/admin" rendrait tout /admin/* public (fuite du dashboard, des données clients…).
const ADMIN_PUBLIC = [
  "/admin",              // page login
  "/admin/setup",        // page création premier admin
  "/api/admin/login",   // POST login, DELETE logout
  "/api/admin/setup",   // API création premier admin
];

// Chemins publics des espaces salariés (login, activation, consommation du lien magique).
const TECH_PUBLIC = ["/technicien/login", "/technicien/activation", "/api/technicien/login", "/api/technicien/verify"];
const COMMERCIAL_PUBLIC = ["/commercial/login", "/commercial/activation", "/api/commercial/login", "/api/commercial/verify"];

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  return new TextEncoder().encode(secret);
}

function matchesAny(pathname: string, paths: string[]): boolean {
  return paths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

/** Garde optimiste : exige un cookie de session au JWT valide (signature + expiration).
 *  L'autorisation fine (rôle, compte actif/non supprimé) est faite dans la couche
 *  données — la doc Next recommande de ne PAS faire d'auth complète dans le proxy. */
async function guardSpace(req: NextRequest, cookieName: string, loginPath: string): Promise<NextResponse> {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");
  const token = req.cookies.get(cookieName)?.value;

  if (!token) {
    if (isApi) return NextResponse.json({ error: "Session expirée — reconnectez-vous" }, { status: 401 });
    return NextResponse.redirect(new URL(loginPath, req.url));
  }
  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    if (isApi) return NextResponse.json({ error: "Session expirée — reconnectez-vous" }, { status: 401 });
    const res = NextResponse.redirect(new URL(loginPath, req.url));
    res.cookies.set(cookieName, "", clearCookieOptions(req.headers.get("host")));
    return res;
  }
}

export async function proxy(req: NextRequest) {
  const hostname = req.headers.get("host") ?? "";
  const { pathname } = req.nextUrl;

  // Sous-domaine calculateur.climexpert.fr → /calculateur
  if (hostname.startsWith("calculateur.")) {
    if (pathname.startsWith("/api/")) return NextResponse.next();
    const url = req.nextUrl.clone();
    const path = pathname === "/" ? "" : pathname;
    url.pathname = `/calculateur${path}`;
    return NextResponse.rewrite(url);
  }

  // Espace technicien
  if (pathname.startsWith("/technicien") || pathname.startsWith("/api/technicien")) {
    if (matchesAny(pathname, TECH_PUBLIC)) return NextResponse.next();
    return guardSpace(req, "tech_token", "/technicien/login");
  }

  // Espace commercial
  if (pathname.startsWith("/commercial") || pathname.startsWith("/api/commercial")) {
    if (matchesAny(pathname, COMMERCIAL_PUBLIC)) return NextResponse.next();
    return guardSpace(req, "commercial_token", "/commercial/login");
  }

  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  // Correspondance EXACTE (cf. ADMIN_PUBLIC) : ne pas rendre /admin/* public.
  if (ADMIN_PUBLIC.includes(pathname)) {
    return NextResponse.next();
  }

  const token = req.cookies.get("admin_token")?.value;
  const isApiRoute = pathname.startsWith("/api/");

  if (!token) {
    if (isApiRoute) return NextResponse.json({ error: "Session expirée — reconnectez-vous" }, { status: 401 });
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    if (isApiRoute) return NextResponse.json({ error: "Session expirée — reconnectez-vous" }, { status: 401 });
    const res = NextResponse.redirect(new URL("/admin", req.url));
    res.cookies.set("admin_token", "", clearCookieOptions(req.headers.get("host")));
    return res;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/technicien/:path*",
    "/api/technicien/:path*",
    "/commercial/:path*",
    "/api/commercial/:path*",
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
