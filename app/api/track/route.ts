import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { evenements } from "@/lib/db/schema";

const TYPES = new Set(["page_view", "calculateur_complete", "alex_open", "devis_view", "contact_view"]);

// Tracking analytics public (visites, calculateur…). Best-effort : ne jamais
// faire échouer l'expérience visiteur si l'enregistrement échoue.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const type = String(body.type ?? "");
    if (!TYPES.has(type)) return NextResponse.json({ ok: false }, { status: 400 });

    const referer = req.headers.get("referer") ?? null;
    let refDomain: string | null = null;
    if (referer) {
      try { refDomain = new URL(referer).hostname; } catch { /* ignore */ }
    }

    await db.insert(evenements).values({
      type,
      path: typeof body.path === "string" ? body.path.slice(0, 500) : null,
      sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null,
      referer: refDomain,
      meta: body.meta ? JSON.stringify(body.meta).slice(0, 1000) : null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
