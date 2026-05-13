"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X, Send, ArrowRight, Zap, CheckCircle2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME = "Bonjour 👋 Je suis Alex, l'assistant ClimExpert. Quel est votre projet de climatisation ?";

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [leadComplete, setLeadComplete] = useState(false);
  const [leadName, setLeadName] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const topic = (e as CustomEvent<{ topic?: string }>).detail?.topic;
      setOpen(true);
      if (topic) {
        setTimeout(() => sendMessage(topic), 400);
      }
    };
    window.addEventListener("open-chat", handler);
    return () => window.removeEventListener("open-chat", handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 350);
    }
  }, [open, messages]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.message || data.error }]);
      if (data.leadComplete) {
        setLeadComplete(true);
        setLeadName(data.lead?.name || "");
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Une erreur est survenue. Réessayez ou contactez-nous directement." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <>
      {/* Bubble launcher */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="bubble"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-sky-500 hover:bg-sky-400 text-white shadow-xl shadow-sky-500/40 flex items-center justify-center"
            aria-label="Ouvrir le chat"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 0.85, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 24 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[360px] bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl shadow-black/20 border border-slate-100 flex flex-col sm:origin-bottom-right"
            style={{ height: "min(520px, 90vh)" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-100 rounded-t-3xl bg-[#0B1120]">
              <motion.div
                initial={{ rotate: -20, scale: 0.7 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0"
              >
                <Zap className="w-4 h-4 text-sky-400" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">Alex · ClimExpert</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-slate-400 text-xs">En ligne · Répond en quelques secondes</span>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                onClick={() => setOpen(false)}
                className="p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 28 }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-sky-500 text-white rounded-tr-sm"
                          : "bg-slate-100 text-slate-800 rounded-tl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                    {[0, 150, 300].map((delay) => (
                      <span
                        key={delay}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Écran confirmation lead */}
            <AnimatePresence>
              {leadComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-4 mb-3 bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-emerald-800 font-semibold text-sm">
                      {leadName ? `Merci ${leadName} !` : "Demande enregistrée !"}
                    </p>
                    <p className="text-emerald-600 text-xs mt-0.5">
                      Votre fiche a été transmise à notre équipe. Un technicien vous rappelle sous 24h.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick actions */}
            <AnimatePresence>
              {messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ delay: 0.2 }}
                  className="px-4 pb-2 flex flex-wrap gap-2"
                >
                  {["Installation", "Entretien", "Dépannage", "Tarifs"].map((label, i) => (
                    <motion.button
                      key={label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 + i * 0.07, type: "spring", stiffness: 400 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => sendMessage(label)}
                      className="px-3 py-1.5 rounded-full bg-sky-50 text-sky-600 border border-sky-100 text-xs font-medium hover:bg-sky-100 transition-colors"
                    >
                      {label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* CTA devis */}
            <div className="px-4 pb-2">
              <a
                href="/devis"
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl bg-sky-50 border border-sky-100 text-sky-600 text-xs font-medium hover:bg-sky-100 transition-colors"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                Demander un devis gratuit
              </a>
            </div>

            {/* Input */}
            <div className={`p-4 pt-2 border-t border-slate-100 ${leadComplete ? "opacity-50 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-2.5 focus-within:border-sky-300 focus-within:ring-2 focus-within:ring-sky-100 transition-all">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Écrivez votre message…"
                  className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none min-w-0"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white flex items-center justify-center transition-colors flex-shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </motion.button>
              </div>
              <div className="flex items-center justify-center gap-1 mt-2">
                <span className="text-slate-300 text-[10px]">Propulsé par</span>
                <span className="text-slate-400 text-[10px] font-medium">Claude AI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
