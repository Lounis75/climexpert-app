import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = [
  "/admin",              // page login
  "/api/admin/login",   // POST login, DELETE logout
  "/api/admin/setup",   // création premier admin
];

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET ?? "";
  return new TextEncoder().encode(secret);
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

  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
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
    res.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
    return res;
  }
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
