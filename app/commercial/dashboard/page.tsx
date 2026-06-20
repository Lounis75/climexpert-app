import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCommercialToken, COMMERCIAL_COOKIE_NAME } from "@/lib/auth";
import { getRendezVous } from "@/lib/leads";
import CommercialDashboard, { type RdvItem } from "./CommercialDashboard";

export const dynamic = "force-dynamic";

export default async function CommercialDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COMMERCIAL_COOKIE_NAME)?.value;
  const session = token ? await verifyCommercialToken(token) : null;
  if (!session) redirect("/commercial/login");

  // Uniquement les rendez-vous (RDV pris) liés à ce commercial.
  const rdvs: RdvItem[] = (await getRendezVous({ commercialId: session.sub })).map((r) => ({
    id: r.id, name: r.name, phone: r.phone, project: r.project,
    location: r.address ?? r.location ?? null,
    rdvDate: r.rdvDate ? new Date(r.rdvDate).toISOString() : null,
  }));

  return <CommercialDashboard session={session} rdvs={rdvs} />;
}
