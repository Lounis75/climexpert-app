"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, X, Wind, MessageCircle, Calculator } from "lucide-react";

const navLinks = [
  { label: "Services", href: "/#services" },
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
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-500/30 group-hover:shadow-sky-500/50 transition-shadow">
              <Wind className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-lg tracking-tight">
              Clim<span className="text-sky-400">Expert</span>
            </span>
          </Link>

          {/* Nav desktop */}
          <nav className="hidden lg:flex items-center gap-6">
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

          {/* Burger mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden p-2 text-slate-300 hover:text-white transition-colors"
            aria-label="Menu"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Menu mobile */}
      {menuOpen && (
        <div className="lg:hidden bg-slate-900/98 backdrop-blur-md border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
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
            <div className="mt-3 pt-3 border-t border-white/10">
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
