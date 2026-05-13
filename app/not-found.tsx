import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Page introuvable — ClimExpert",
  description: "Cette page n'existe pas. Retrouvez nos services de climatisation en Île-de-France.",
};

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-[#0B1120] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <p className="text-sky-400 font-bold text-6xl mb-4">404</p>
          <h1 className="text-2xl font-bold text-white mb-3">Page introuvable</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            La page que vous cherchez n&apos;existe pas ou a été déplacée.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-semibold rounded-xl text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à l&apos;accueil
            </Link>
            <Link
              href="/guide-climatisation"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/8 hover:bg-white/12 text-white font-semibold rounded-xl text-sm border border-white/10 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Voir le guide
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
