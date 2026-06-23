"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";

// Chargé uniquement côté client, après l'hydratation : sort framer-motion
// (~30-60 kB) du chemin critique de rendu de toutes les pages.
const ChatBot = dynamic(() => import("@/components/ChatBot"), { ssr: false });

export default function ChatBotLoader() {
  const pathname = usePathname();
  // Alex est l'assistant du SITE PUBLIC. Dans le back-office (admin/technicien/
  // commercial) et sur les écrans de connexion, on ne l'affiche pas, sinon il se
  // superpose à l'assistant dédié de l'admin. (Évite deux widgets de chat.)
  if (pathname && /^\/(admin|technicien|commercial|connexion|activer)(\/|$)/.test(pathname)) {
    return null;
  }
  return <ChatBot />;
}
