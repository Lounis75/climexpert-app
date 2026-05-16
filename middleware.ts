import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ADMIN_PUBLIC_PATHS = [
  "/admin",
  "/api/admin/login",
  "/api/admin/setup",
];

const TECH_PUBLIC_PATHS = [
  "/technicien/login",
  "/technicien/activation",
  "/api/technicien/login",
  "/api/technicien/verify",
];

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.NEXTAUTH_SECRET ?? "");
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── Admin routes ──────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (ADMIN_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.next();
    }
    const token = req.cookies.get("admin_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/admin", req.url));
    try {
      const { payload } = await jwtVerify(token, getSecret());
      if (payload.role !== "admin") throw new Error();
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL("/admin", req.url));
      res.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
      return res;
    }
  }

  // ─── Technicien routes ─────────────────────────────────────────────────────
  if (pathname.startsWith("/technicien") || pathname.startsWith("/api/technicien")) {
    if (TECH_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
      return NextResponse.next();
    }
    const token = req.cookies.get("tech_token")?.value;
    if (!token) return NextResponse.redirect(new URL("/technicien/login", req.url));
    try {
      const { payload } = await jwtVerify(token, getSecret());
      if (payload.role !== "technicien") throw new Error();
      return NextResponse.next();
    } catch {
      const res = NextResponse.redirect(new URL("/technicien/login", req.url));
      res.cookies.set("tech_token", "", { maxAge: 0, path: "/" });
      return res;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/technicien/:path*", "/api/technicien/:path*"],
};
