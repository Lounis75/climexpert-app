"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Zap, CheckCircle2, Phone } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const COMPANY_PHONE = "06 67 43 27 67";
function genSessionId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

export default function QualifChat({ token, prenom }: { token: string; prenom: string }) {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: `Bonjour${prenom ? ` ${prenom}` : ""} 👋 Je suis Alex, l'assistant de ClimExpert. Merci de votre appel ! Pour préparer au mieux votre intervention et réduire le temps d'attente, parlez-moi de votre besoin : quel type de projet (installation, entretien, dépannage) et combien de pièces ?`,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const sessionId = useRef(genSessionId());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading || done) return;
    const newMessages = [...messages, { role: "user" as const, content }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, sessionId: sessionId.current, qualifToken: token }),
      });
      const data = await res.json();
      setMessages([...newMessages, { role: "assistant", content: data.message || data.error || "..." }]);
      if (data.leadComplete) setDone(true);
    } catch {
      setMessages([...newMessages, { role: "assistant", content: "Une erreur est survenue. Vous pouvez nous appeler directement au " + COMPANY_PHONE + "." }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#0B1120] px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-sky-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">Alex · ClimExpert</p>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400 text-xs">En ligne · vos réponses préparent votre devis</span>
          </div>
        </div>
        <a href={`tel:${COMPANY_PHONE.replace(/\s/g, "")}`} className="text-slate-400 hover:text-sky-300 flex items-center gap-1 text-xs"><Phone className="w-3.5 h-3.5" /></a>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-xl w-full mx-auto">
        <div className="space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-sky-500 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"}`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          )}
          {done && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-emerald-800 font-semibold text-sm">C&apos;est noté{prenom ? `, ${prenom}` : ""} !</p>
                <p className="text-emerald-600 text-xs mt-0.5">Votre besoin est transmis à notre équipe. On vous recontacte très vite pour caler un rendez-vous. Merci !</p>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white px-4 py-3 sticky bottom-0">
        <div className={`max-w-xl mx-auto flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-2.5 focus-within:border-sky-300 ${done ? "opacity-50 pointer-events-none" : ""}`}>
          <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey} autoFocus
            placeholder={done ? "Conversation terminée" : "Écrivez votre réponse…"}
            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none min-w-0" />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading || done}
            className="w-8 h-8 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0">
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-center text-slate-400 text-[10px] mt-2">Propulsé par Claude AI · ClimExpert</p>
      </footer>
    </div>
  );
}
