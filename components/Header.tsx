"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Wind, MessageCircle, Calculator, Phone, ChevronDown } from "lucide-react";
import { TEL_DISPLAY, TEL_LINK } from "@/lib/coordonnees";

// Pages piliers : liées depuis le header (présent partout) pour le maillage interne SEO,
// pas seulement depuis le footer.
const serviceLinks = [
  { label: "Installation", href: "/installation" },
  { label: "Entretien", href: "/entretien" },
  { label: "Dépannage", href: "/depannage" },
  { label: "Tarifs", href: "/tarifs" },
];

const navLinks = [
  { label: "Entreprises", href: "/#entreprises" },
  { label: "Pourquoi nous", href: "/#pourquoi" },
  { label: "Avis", href: "/#avis" },
  { label: "Guide", href: "/guide-climatisation" },
  { label: "Contact", href: "/contact" },
];

const calcLink = { label: "Calculateur", href: "/#calculateur" };

function openChat() {
  window.dispatchEvent(new CustomEvent("open-chat"));
}

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-slate-900/95 backdrop-blur-md shadow-lg shadow-black/20"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:shadow-sky-500/50 transition-shadow">
              <Wind className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              Clim<span className="text-sky-400">Expert</span>
            </span>
          </a>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-6">
            {/* Services : lien ancre + sous-menu vers les pages piliers */}
            <div className="relative group">
              <a
                href="/#services"
                className="flex items-center gap-1 text-slate-300 hover:text-white text-sm font-medium transition-colors duration-200"
              >
                Services
                <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
              </a>
              <div className="absolute left-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150">
                <div className="bg-slate-900/98 backdrop-blur-md border border-white/10 rounded-xl shadow-xl shadow-black/40 py-2 w-44">
                  {serviceLinks.map((s) => (
                    <Link
                      key={s.href}
                      href={s.href}
                      className="block px-4 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 text-sm font-medium transition-colors"
                    >
                      {s.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-slate-300 hover:text-white text-sm font-medium transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
            <a
              href={calcLink.href}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-300 hover:text-sky-200 hover:bg-sky-500/15 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <Calculator className="w-3.5 h-3.5" />
              {calcLink.label}
            </a>
          </nav>

          {/* Actions desktop */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href={TEL_LINK}
              className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              <Phone className="w-4 h-4 text-sky-400" />
              {TEL_DISPLAY}
            </a>
            <button
              onClick={openChat}
              className="flex items-center gap-2 text-slate-300 hover:text-white text-sm font-medium transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-sky-400" />
              Estimation rapide
            </button>
            <button
              onClick={openChat}
              className="px-5 py-2.5 bg-sky-500 hover:bg-sky-400 text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40"
            >
              Devis gratuit
            </button>
          </div>

          {/* Mobile : appel direct toujours visible (prospect pressé, dépannage) + burger */}
          <div className="lg:hidden flex items-center gap-1">
            <a
              href={TEL_LINK}
              aria-label={`Appeler ClimExpert au ${TEL_DISPLAY}`}
              className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/25 text-sky-300 hover:text-sky-200 transition-colors"
            >
              <Phone className="w-5 h-5" />
            </a>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 text-slate-300 hover:text-white transition-colors"
              aria-label="Menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="lg:hidden bg-slate-900/98 backdrop-blur-md border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            <p className="px-4 pt-1 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Nos services</p>
            {serviceLinks.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 px-4 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
              >
                {s.label}
              </Link>
            ))}
            <div className="my-1 border-t border-white/10" />
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="py-3 px-4 text-slate-300 hover:text-white hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
              >
                {link.label}
              </a>
            ))}
            <a
              href={calcLink.href}
              onClick={() => setMenuOpen(false)}
              className="py-3 px-4 flex items-center gap-2 text-sky-300 hover:text-sky-200 hover:bg-sky-500/10 rounded-lg text-sm font-semibold transition-colors"
            >
              <Calculator className="w-4 h-4" />
              {calcLink.label} gratuit
            </a>
            <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
              <a
                href={TEL_LINK}
                className="w-full py-3 px-4 flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white text-sm font-semibold rounded-xl"
              >
                <Phone className="w-4 h-4 text-sky-400" />
                Appeler : {TEL_DISPLAY}
              </a>
              <button
                onClick={() => { setMenuOpen(false); openChat(); }}
                className="w-full py-3 px-4 bg-sky-500 text-white text-sm font-semibold rounded-xl text-center"
              >
                Devis gratuit
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
