import AdminHeader from "@/components/AdminHeader";
import { Bot } from "lucide-react";
import { getAlexConsignes } from "@/lib/alex-consignes";
import ConsignesEditor from "./ConsignesEditor";

export const dynamic = "force-dynamic";

export default async function AssistantAlexPage() {
  const consignes = await getAlexConsignes();
  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2"><Bot className="w-6 h-6 text-sky-400" /> Assistant Alex</h1>
          <p className="text-slate-400 text-sm">Pilote ce qu&apos;Alex dit aux clients : le délai d&apos;intervention du moment et tes consignes. Modifiable à tout moment, appliqué partout instantanément.</p>
        </div>
        <ConsignesEditor initial={{ delaiJours: consignes.delaiJours, consignes: consignes.consignes }} />
      </main>
    </div>
  );
}
