"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Zap, CheckCircle2, Phone, Camera } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };

const COMPANY_PHONE = "06 67 43 27 67";
function genSessionId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

// Alex peut suggérer des réponses cliquables via une ligne "OPTIONS: a | b | c" en fin de message.
function parseOptions(content: string): { text: string; options: string[] } {
  const m = content.match(/\n?\s*OPTIONS\s*:\s*(.+?)\s*$/i);
  if (!m || m.index === undefined) return { text: content, options: [] };
  const options = m[1].split("|").map((s) => s.trim()).filter(Boolean).slice(0, 6);
  const text = content.slice(0, m.index).trim();
  return { text: text || content, options };
}

export default function QualifChat({ token, prenom }: { token: string; prenom: string }) {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: `Bonjour${prenom ? ` ${prenom}` : ""} 👋 Je suis Alex, l'assistant de ClimExpert. Merci de votre appel ! Pour préparer au mieux votre intervention, dites-moi de quel type de projet il s'agit.\nOPTIONS: Installation | Entretien | Dépannage | Autre`,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const sessionId = useRef(genSessionId());
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setMessages([...newMessages, { role: "assistant", content: `Une erreur est survenue. Vous pouvez nous appeler directement au ${COMPANY_PHONE}.` }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function uploadPhoto(file: File) {
    if (uploading) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`/api/qualif/${token}/photo`, { method: "POST", body: fd });
      const d = await res.json().catch(() => ({}));
      if (res.ok) {
        setPhotoCount((c) => c + 1);
        setMessages((m) => [...m, { role: "assistant", content: "📷 Photo bien reçue, merci ! Elle est transmise à notre équipe et nous aidera à préparer votre devis." }]);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: d.error ?? "La photo n'a pas pu être envoyée, réessayez." }]);
      }
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Erreur réseau pour l'envoi de la photo, réessayez." }]);
    } finally {
      setUploading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const lastOptions = (() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant" || loading || done) return [];
    return parseOptions(last.content).options;
  })();

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50">
      <header className="flex-shrink-0 bg-[#0B1120] px-4 py-3 flex items-center gap-3">
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
        <a href={`tel:${COMPANY_PHONE.replace(/\s/g, "")}`} aria-label="Appeler" className="text-slate-400 hover:text-sky-300 p-1"><Phone className="w-4 h-4" /></a>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-4 py-4">
        <div className="max-w-xl w-full mx-auto space-y-3">
          {messages.map((msg, i) => {
            const { text } = msg.role === "assistant" ? parseOptions(msg.content) : { text: msg.content };
            return (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-sky-500 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"}`}>
                  {text}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                {[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
              </div>
            </div>
          )}

          {/* Réponses rapides cliquables (mobile-first) + petit indice "on peut cliquer" */}
          {lastOptions.length > 0 && (
            <div className="pt-1">
              <p className="text-slate-400 text-[11px] mb-1.5 flex items-center gap-1">
                <span className="animate-bounce">👇</span> Touchez une réponse, ou écrivez la vôtre
              </p>
              <div className="flex flex-wrap gap-2">
                {lastOptions.map((opt) => (
                  <button key={opt} onClick={() => sendMessage(opt)}
                    className="px-3.5 py-2 rounded-full bg-sky-500 text-white text-sm font-medium hover:bg-sky-400 active:scale-95 transition-all shadow-sm shadow-sky-500/30">
                    {opt}
                  </button>
                ))}
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

      <footer className="flex-shrink-0 border-t border-slate-200 bg-white px-3 py-3">
        <div className="max-w-xl mx-auto">
          {/* Bouton photo bien visible (mobile : ouvre l'appareil photo) */}
          {!done && (
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full mb-2 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-sky-200 bg-sky-50 text-sky-700 text-sm font-semibold hover:bg-sky-100 disabled:opacity-50 active:scale-[0.99] transition-all">
              <Camera className="w-4 h-4" /> {uploading ? "Envoi de la photo…" : photoCount > 0 ? `Ajouter une autre photo (${photoCount})` : "Ajouter une photo de l'installation"}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); e.currentTarget.value = ""; }} />

          <div className={`flex items-center gap-2 bg-slate-50 rounded-2xl border border-slate-200 px-4 py-2.5 focus-within:border-sky-300 ${done ? "opacity-50 pointer-events-none" : ""}`}>
            <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKey}
              placeholder={done ? "Conversation terminée" : "Écrivez votre réponse…"}
              className="flex-1 bg-transparent text-base text-slate-800 placeholder-slate-400 outline-none min-w-0" />
            <button onClick={() => sendMessage()} disabled={!input.trim() || loading || done}
              className="w-9 h-9 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-slate-400 text-[10px] mt-2">Propulsé par Claude AI · ClimExpert</p>
        </div>
      </footer>
    </div>
  );
}
