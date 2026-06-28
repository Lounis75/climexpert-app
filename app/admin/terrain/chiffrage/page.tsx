import AdminHeader from "@/components/AdminHeader";
import { getCatalogue } from "@/lib/catalogue";
import ChiffrageTool from "./ChiffrageTool";

export const dynamic = "force-dynamic";

export default async function ChiffragePage() {
  const catalogue = await getCatalogue();
  return (
    <div className="min-h-screen bg-[#080d18]">
      <div className="print:hidden"><AdminHeader /></div>
      <main className="bg-[#F5F7FA] min-h-screen px-4 sm:px-6 py-6">
        <div className="max-w-[880px] mx-auto mb-4 print:hidden">
          <h1 className="text-xl font-bold text-[#0F1B2D]">Chiffrage terrain</h1>
          <p className="text-sm text-[#6A7686]">Le commercial remplit, l&apos;outil dimensionne et chiffre le devis.</p>
        </div>
        <ChiffrageTool catalogue={catalogue} />
      </main>
    </div>
  );
}
