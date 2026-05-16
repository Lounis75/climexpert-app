import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyTechnicienToken, TECH_COOKIE_NAME } from "@/lib/auth";
import TechnicienNav from "./TechnicienNav";

export const metadata: Metadata = {
  title: "ClimExpert Technicien",
  manifest: "/manifest.json",
  themeColor: "#0ea5e9",
};

export default async function TechnicienLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(TECH_COOKIE_NAME)?.value;
  let session = null;
  if (token) session = await verifyTechnicienToken(token);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {session && <TechnicienNav name={session.name} />}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
