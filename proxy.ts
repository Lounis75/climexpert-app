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
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/admin") && !pathname.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("admin_token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL("/admin", req.url));
    res.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
    return res;
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
