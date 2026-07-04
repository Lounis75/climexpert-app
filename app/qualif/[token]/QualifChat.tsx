"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Zap, CheckCircle2, Phone, Camera, CalendarClock } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import ChatSosForm from "@/components/ChatSosForm";

type Message = { role: "user" | "assistant"; content: string };

const COMPANY_PHONE = "06 67 43 27 67";
function genSessionId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

// Alex pilote l'interface : "OPTIONS: a | b | c" -> boutons cliquables ; "[[PHOTO]]" -> propose
// l'ajout de photo (uniquement quand il le décide, vers la fin). On retire ces marqueurs du texte affiché.
function parseDirectives(content: string): { text: string; options: string[]; photo: boolean } {
  let text = content;
  const photo = /\[\[PHOTO\]\]/i.test(text);
  if (photo) text = text.replace(/\[\[PHOTO\]\]/gi, "").trim();
  text = text.replace(/\[\[RDV\]\]/gi, "").trim(); // marqueur RDV retiré du texte affiché
  let options: string[] = [];
  const m = text.match(/\n?\s*OPTIONS\s*:\s*(.+?)\s*$/i);
  if (m && m.index !== undefined) {
    options = m[1].split("|").map((s) => s.trim()).filter(Boolean).slice(0, 6);
    text = text.slice(0, m.index).trim() || text;
  }
  return { text, options, photo };
}

export default function QualifChat({ token, prenom }: { token: string; prenom: string }) {
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: `Bonjour${prenom ? ` ${prenom}` : ""} 👋 Je suis Alex, l'assistant de ClimExpert. Merci de nous avoir contactés ! Pour préparer au mieux votre intervention, dites-moi de quel type de projet il s'agit.\nOPTIONS: Installation | Entretien | Dépannage | Dépose | Autre`,
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoCount, setPhotoCount] = useState(0);
  const [rdvSlots, setRdvSlots] = useState<{ id: string; label: string }[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [rdvBooked, setRdvBooked] = useState<string | null>(null);
  const [rdvError, setRdvError] = useState("");
  const [sosMode, setSosMode] = useState(false); // IA en panne : formulaire de secours
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
        body: JSON.stringify({ messages: newMessages, sessionId: sessionId.current, qualifToken: token, stream: true }),
      });
      const ct = res.headers.get("content-type") ?? "";
      let data: { message?: string; error?: string; fallback?: boolean; leadComplete?: boolean; lead?: { name?: string } } = {};
      if (ct.includes("ndjson") && res.body) {
        // Streaming : la réponse s'affiche mot à mot (le 1er mot arrive en ~0,5 s au lieu de 2-4 s).
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "", acc = "";
        while (true) {
          const { done: end, value } = await reader.read();
          if (end) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const ev = JSON.parse(line);
              if (ev.t === "d") {
                if (!acc) setLoading(false); // 1er mot arrivé : on remplace les pointillés par la bulle
                acc += ev.v;
                setMessages([...newMessages, { role: "assistant", content: acc }]);
              } else if (ev.t === "done") { data = ev; }
            } catch { /* ligne incomplète, complétée au prochain paquet */ }
          }
        }
        setMessages([...newMessages, { role: "assistant", content: data.message || acc || "..." }]);
      } else {
        data = await res.json();
        setMessages([...newMessages, { role: "assistant", content: data.message || data.error || "..." }]);
      }
      if (data.fallback) setSosMode(true); // IA en panne : formulaire de secours (nom + tel)
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
    return parseDirectives(last.content).options;
  })();
  // Le bouton photo n'apparaît QUE quand Alex l'a proposé (marqueur [[PHOTO]]), pas en permanence.
  const photoInvited = messages.some((m) => m.role === "assistant" && /\[\[PHOTO\]\]/i.test(m.content));
  // Créneaux de visite : Alex émet [[RDV]] pour proposer un rendez-vous, le portail affiche les
  // vrais créneaux ouverts (Alex n'invente jamais de date).
  const rdvInvited = messages.some((m) => m.role === "assistant" && /\[\[RDV\]\]/i.test(m.content));

  useEffect(() => {
    if (rdvInvited && !rdvBooked && rdvSlots === null && !loadingSlots) {
      setLoadingSlots(true);
      fetch(`/api/qualif/${token}/rdv`)
        .then((r) => r.json())
        .then((d) => setRdvSlots(Array.isArray(d.creneaux) ? d.creneaux : []))
        .catch(() => setRdvSlots([]))
        .finally(() => setLoadingSlots(false));
    }
  }, [rdvInvited, rdvBooked, rdvSlots, loadingSlots, token]);

  async function bookRdv(slotId: string, label: string) {
    setBookingId(slotId); setRdvError("");
    try {
      const res = await fetch(`/api/qualif/${token}/rdv`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slotId }) });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (d.taken) { setRdvError("Ce créneau vient d'être pris."); const r = await fetch(`/api/qualif/${token}/rdv`).then((x) => x.json()).catch(() => ({})); setRdvSlots(Array.isArray(r.creneaux) ? r.creneaux : []); }
        else setRdvError(d.error ?? "Réservation impossible, réessayez.");
        return;
      }
      setRdvBooked(d.label ?? label);
    } catch { setRdvError("Erreur réseau, réessayez."); }
    finally { setBookingId(null); }
  }

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
            const { text } = msg.role === "assistant" ? parseDirectives(msg.content) : { text: msg.content };
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

          {/* Créneaux de visite proposés par Alex (réservation immédiate) */}
          {rdvInvited && !rdvBooked && (
            <div className="pt-1">
              {loadingSlots ? (
                <p className="text-slate-400 text-xs">Recherche des créneaux disponibles…</p>
              ) : rdvSlots && rdvSlots.length > 0 ? (
                <>
                  <p className="text-slate-500 text-[11px] mb-1.5 flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5 text-sky-500" /> Choisissez un créneau de visite :</p>
                  <div className="flex flex-col gap-2">
                    {rdvSlots.map((s) => (
                      <button key={s.id} onClick={() => bookRdv(s.id, s.label)} disabled={bookingId !== null}
                        className="text-left px-4 py-2.5 rounded-xl bg-white border border-sky-200 text-slate-800 text-sm font-medium hover:border-sky-400 hover:bg-sky-50 disabled:opacity-50 active:scale-[0.99] transition-all">
                        {bookingId === s.id ? "Réservation…" : s.label}
                      </button>
                    ))}
                  </div>
                  {rdvError && <p className="text-red-500 text-xs mt-1.5">{rdvError}</p>}
                </>
              ) : (
                <p className="text-slate-400 text-xs">Aucun créneau en ligne pour l&apos;instant, notre équipe vous proposera un rendez-vous rapidement.</p>
              )}
            </div>
          )}
          {rdvBooked && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-4 flex items-start gap-3">
              <CalendarClock className="w-5 h-5 text-sky-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sky-800 font-semibold text-sm">Rendez-vous confirmé !</p>
                <p className="text-sky-600 text-xs mt-0.5">{rdvBooked}. Vous recevez un e-mail de confirmation. À très vite !</p>
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
          {sosMode && !done && <ChatSosForm />}
          <div ref={bottomRef} />
        </div>
      </main>

      <footer className="flex-shrink-0 border-t border-slate-200 bg-white px-3 py-3">
        <div className="max-w-xl mx-auto">
          {/* Bouton photo : visible UNIQUEMENT quand Alex l'a proposé (vers la fin), pas en permanence */}
          {photoInvited && !done && (
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full mb-2 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-sky-500 text-white text-sm font-semibold hover:bg-sky-400 disabled:opacity-50 active:scale-[0.99] transition-all shadow-sm shadow-sky-500/30">
              <Camera className="w-4 h-4" /> {uploading ? "Envoi de la photo…" : photoCount > 0 ? `Ajouter une autre photo (${photoCount})` : "Ajouter une photo"}
            </button>
          )}
          {/* Pas de capture="environment" : sur mobile, ça forcerait l'appareil photo et empêcherait
              de choisir une photo EXISTANTE dans la galerie. Sans, iOS/Android proposent les deux. */}
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={async (e) => { const f = e.target.files?.[0]; e.currentTarget.value = ""; if (f) uploadPhoto(await compressImage(f)); }} />

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
