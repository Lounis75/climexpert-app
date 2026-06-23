import type { Metadata } from "next";
import { cookies } from "next/headers";
import { verifyCommercialToken, COMMERCIAL_COOKIE_NAME } from "@/lib/auth";

export const metadata: Metadata = { title: "ClimExpert, Espace Commercial" };

export default async function CommercialLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <main className="flex-1">{children}</main>
    </div>
  );
}
