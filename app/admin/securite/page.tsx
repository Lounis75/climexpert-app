import { cookies } from "next/headers";
import { verifyAdminToken, COOKIE_NAME } from "@/lib/auth";
import AdminHeader from "@/components/AdminHeader";
import Reset2FA from "./Reset2FA";

export const dynamic = "force-dynamic";

export default async function Page() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  const session = token ? await verifyAdminToken(token) : null;

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <Reset2FA adminNom={session?.nom ?? ""} adminEmail={session?.email ?? ""} />
      </main>
    </div>
  );
}
