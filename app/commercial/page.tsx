import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyCommercialToken, COMMERCIAL_COOKIE_NAME } from "@/lib/auth";

export default async function CommercialPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COMMERCIAL_COOKIE_NAME)?.value;
  const session = token ? await verifyCommercialToken(token) : null;
  if (!session) redirect("/commercial/login");
  redirect("/commercial/dashboard");
}
