"use client";

import { useState, useRef, useEffect } from "react";
import { Bot, X, Send, Minus } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const WELCOME = "Bonjour ! Je suis ton assistant interne ClimExpert. Je peux t'aider à utiliser le logiciel, répondre à des questions sur les process ou sur la climatisation. Comment puis-je t'aider ?";

// On ÉCHAPPE d'abord le HTML (le texte peut contenir < > & venus de la réponse du modèle),
// puis on n'autorise QUE le gras **...** et les retours à la ligne. Sinon `dangerouslySetInnerHTML`
// interprèterait n'importe quel HTML présent dans la réponse.
function formatMessage(text: string) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br/>");
}

export default function AdminChatBot() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: WELCOME },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 100);
    }
  }, [open, minimized, messages]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || loading) return;

    const userMessage: Message = { role: "user", content };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/chat-interne", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.message || data.error || "Erreur" }]);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Erreur de connexion." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Bouton flottant */}
      {!open && (
        <button
          onClick={() => { setOpen(true); setMinimized(false); }}
          className="fixed bottom-[calc(4rem+1rem+env(safe-area-inset-bottom))] md:bottom-5 right-5 z-40 w-12 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
          aria-label="Assistant interne"
        >
          <Bot className="w-5 h-5" />
        </button>
      )}

      {/* Panel chat */}
      {open && (
        <div
          className={`fixed bottom-[calc(4rem+1rem+env(safe-area-inset-bottom))] md:bottom-5 right-5 z-50 w-80 sm:w-96 max-w-[calc(100vw-2.5rem)] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col transition-all ${
            minimized ? "h-14" : "h-[500px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-violet-500/20 border border-violet-500/30 rounded-lg flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div>
                <p className="text-white text-xs font-semibold leading-none">Assistant interne</p>
                <p className="text-slate-500 text-[10px] mt-0.5">ClimExpert Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setMinimized(!minimized)}
                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-6 h-6 flex items-center justify-center text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-white/5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-violet-600 text-white"
                          : "bg-slate-800 text-slate-200 border border-white/8"
                      }`}
                      dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                    />
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 border border-white/8 rounded-xl px-3 py-2.5 flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 pb-3 flex-shrink-0">
                <div className="flex items-center gap-2 bg-slate-800 border border-white/10 rounded-xl px-3 py-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder="Poser une question…"
                    disabled={loading}
                    className="flex-1 bg-transparent text-white text-xs placeholder-slate-500 focus:outline-none disabled:opacity-50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    className="w-6 h-6 flex items-center justify-center text-violet-400 hover:text-violet-300 disabled:opacity-30 transition-colors flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
