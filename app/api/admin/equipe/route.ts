import { NextResponse } from "next/server";
import { getCommerciauxAssignables, getTechniciensAssignables } from "@/lib/utilisateurs";

// Listes d'affectation : qui peut être commercial / technicien (admins inclus).
export async function GET() {
  const [commerciaux, techniciens] = await Promise.all([
    getCommerciauxAssignables(),
    getTechniciensAssignables(),
  ]);
  return NextResponse.json({ commerciaux, techniciens });
}
