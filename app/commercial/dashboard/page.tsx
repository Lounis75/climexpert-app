import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCommercialToken, COMMERCIAL_COOKIE_NAME } from "@/lib/auth";
import CommercialDashboard from "./CommercialDashboard";

export const dynamic = "force-dynamic";

export default async function CommercialDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COMMERCIAL_COOKIE_NAME)?.value;
  const session = token ? await verifyCommercialToken(token) : null;
  if (!session) redirect("/commercial/login");

  return <CommercialDashboard session={session} />;
}
