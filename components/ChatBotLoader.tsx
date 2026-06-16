"use client";

import dynamic from "next/dynamic";

// Chargé uniquement côté client, après l'hydratation : sort framer-motion
// (~30-60 kB) du chemin critique de rendu de toutes les pages.
const ChatBot = dynamic(() => import("@/components/ChatBot"), { ssr: false });

export default function ChatBotLoader() {
  return <ChatBot />;
}
