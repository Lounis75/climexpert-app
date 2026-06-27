import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { evenements } from "@/lib/db/schema";

const TYPES = new Set(["page_view", "calculateur_complete", "alex_open", "devis_view", "contact_view"]);

// User-agents de robots / scripts / aperçus de liens / monitoring : on ne les compte pas dans
// les visites (fiabilise le compteur). On reste large sur "bot/crawl/spider" + les outils connus.
// On évite volontairement "facebook"/"instagram" seuls (ce sont de vrais navigateurs in-app).
const BOT_UA = /bot|crawl|spider|slurp|mediapartners|facebookexternalhit|embedly|whatsapp|headless|phantom|puppeteer|playwright|selenium|python-requests|scrapy|curl\/|wget|libwww|httpclient|java\/|go-http|okhttp|node-fetch|axios\/|lighthouse|gtmetrix|pingdom|uptime|statuscake/i;

// Source d'arrivée réelle (à partir de document.referrer envoyé par le client).
// Renvoie null pour un accès direct ou une navigation interne (notre propre domaine).
function normalizeSource(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  let host: string;
  try { host = new URL(raw).hostname.toLowerCase(); } catch { return null; }
  if (!host) return null;
  if (/(^|\.)climexpert\.fr$/.test(host) || host.endsWith(".vercel.app")) return null; // interne / direct
  host = host.replace(/^www\./, "");
  if (host.includes("google")) return "google";
  if (host.includes("bing")) return "bing";
  if (host.includes("duckduckgo")) return "duckduckgo";
  if (host.includes("yahoo")) return "yahoo";
  if (host.includes("ecosia")) return "ecosia";
  if (host.includes("qwant")) return "qwant";
  if (host === "t.co" || host.includes("twitter") || host === "x.com") return "twitter/x";
  if (host.includes("facebook") || host === "fb.com" || host.includes("fb.me")) return "facebook";
  if (host.includes("instagram")) return "instagram";
  if (host.includes("linkedin") || host === "lnkd.in") return "linkedin";
  if (host.includes("youtube") || host === "youtu.be") return "youtube";
  if (host.includes("tiktok")) return "tiktok";
  if (host.includes("pinterest")) return "pinterest";
  return host;
}

// Tracking analytics public (visites, calculateur…). Best-effort : ne jamais
// faire échouer l'expérience visiteur si l'enregistrement échoue.
export async function POST(req: NextRequest) {
  try {
    // Filtre anti-bot : on ignore les crawlers/scripts (200 pour ne pas déclencher de retry client).
    const ua = req.headers.get("user-agent") ?? "";
    if (BOT_UA.test(ua)) return NextResponse.json({ ok: true, skipped: "bot" });

    const body = await req.json().catch(() => ({}));
    const type = String(body.type ?? "");
    if (!TYPES.has(type)) return NextResponse.json({ ok: false }, { status: 400 });

    await db.insert(evenements).values({
      type,
      path: typeof body.path === "string" ? body.path.slice(0, 500) : null,
      sessionId: typeof body.sessionId === "string" ? body.sessionId.slice(0, 100) : null,
      referer: normalizeSource(body.ref),
      meta: body.meta ? JSON.stringify(body.meta).slice(0, 1000) : null,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
