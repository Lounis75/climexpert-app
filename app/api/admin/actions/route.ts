import { NextResponse } from "next/server";
import { getActionsGlobales } from "@/lib/actions";

export const dynamic = "force-dynamic";

// Compteur global des actions à faire (repères rouges prospects + clients).
export async function GET() {
  try {
    return NextResponse.json(await getActionsGlobales());
  } catch {
    return NextResponse.json({ total: 0, prospects: 0, clients: 0 }, { status: 200 });
  }
}
