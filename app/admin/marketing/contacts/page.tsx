import AdminHeader from "@/components/AdminHeader";
import { getMarketingContacts } from "@/lib/marketing";
import MarketingContacts from "./MarketingContacts";
import { Megaphone } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function MarketingContactsPage() {
  const contacts = await getMarketingContacts();

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
            <Megaphone className="w-4 h-4" />
          </div>
          <h1 className="text-2xl font-bold text-white">Base de contacts</h1>
        </div>
        <p className="text-slate-400 text-sm mb-8">Prospects et clients réunis pour vos campagnes. Filtrez par consentement et exportez en CSV.</p>
        <MarketingContacts contacts={contacts} />
      </main>
    </div>
  );
}
