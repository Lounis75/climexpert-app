"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, ClipboardList, Check } from "lucide-react";
import { QUALIF_GROUPS, isQualified, type Qualification } from "@/lib/qualification";

/** Section « Qualification des besoins » du panneau prospect : guide d'appel dépliable.
 *  Mise en avant (badge « À remplir ») au stade « Contact établi » tant que non renseignée. */
export default function LeadQualification({
  value, status, onSave, notes, onSaveNotes, dateSouhaitee, onSaveDateSouhaitee, consent, onSaveConsent,
}: {
  value: Qualification | null | undefined;
  status: string;
  onSave: (q: Qualification) => Promise<void>;
  notes?: string | null;
  onSaveNotes: (text: string) => Promise<void>;
  dateSouhaitee: string;
  onSaveDateSouhaitee: (localValue: string) => Promise<void>;
  consent: boolean;
  onSaveConsent: (v: boolean) => Promise<void>;
}) {
  const alreadyQualified = isQualified(value);
  const aRemplir = status === "contacté" && !alreadyQualified;
  const [open, setOpen] = useState(aRemplir);
  const [form, setForm] = useState<Qualification>(value ?? {});
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  // Note / remarques : MÊME base que la « Note interne » du bas de fiche (lead.notes).
  const [note, setNote] = useState(notes ?? "");
  const noteFocused = useRef(false);
  useEffect(() => { if (!noteFocused.current) setNote(notes ?? ""); }, [notes]);

  const set = (k: keyof Qualification, v: string) => setForm((p) => ({ ...p, [k]: v }));

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({ ...form, qualifieLe: value?.qualifieLe ?? new Date().toISOString() });
      if ((note ?? "") !== (notes ?? "")) await onSaveNotes(note);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  // Hauteur fixe (h-11) sur tous les champs -> cellules homogènes quel que soit le
  // type de contrôle (select/input se rendent différemment selon le navigateur).
  const inputCls = "w-full h-11 px-3 rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors";
  // Champs numériques : on masque les flèches natives pour un rendu identique aux autres.
  const numCls = `${inputCls} [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`;
  // Zone de texte : hauteur libre (multi-lignes), même style.
  const taCls = "w-full px-3 py-2 rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors resize-none";

  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/30 overflow-hidden">
      {/* En-tête repliable */}
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 px-4 py-3 hover:bg-white/[0.02] transition-colors">
        <span className="flex items-center gap-2 text-sm font-semibold text-white">
          <ClipboardList className="w-4 h-4 text-sky-400" />
          Qualification des besoins
          {alreadyQualified ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">Renseignée</span>
          ) : aRemplir ? (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 animate-pulse">À remplir</span>
          ) : null}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Formulaire guidé */}
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-white/8 pt-4">
          <p className="text-xs text-slate-400 bg-sky-500/[0.06] border border-sky-500/15 rounded-lg px-3 py-2">
            Déroule le guide pendant l&apos;appel pour ne rien oublier. Tout est optionnel, remplis ce que tu obtiens, ça pré-remplira la fiche pour le commercial et le technicien.
          </p>
          {QUALIF_GROUPS.map((g) => (
            <div key={g.titre}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">{g.emoji} {g.titre}</p>
              <div className="grid grid-cols-2 gap-2">
                {g.champs.filter((c) => !c.showIf || c.showIf(form)).map((c) => (
                  <div key={c.key} className={c.full || c.type === "textarea" ? "col-span-2" : ""}>
                    <label className="block text-[11px] text-slate-400 mb-1">{c.label}</label>
                    {c.type === "select" ? (
                      <select value={(form[c.key] as string | undefined) ?? ""} onChange={(e) => set(c.key, e.target.value)} className={inputCls}>
                        <option value="">Sélectionner</option>
                        {c.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : c.type === "textarea" ? (
                      <textarea value={(form[c.key] as string | undefined) ?? ""} onChange={(e) => set(c.key, e.target.value)} rows={2} placeholder={c.placeholder} className={taCls} />
                    ) : (
                      <input type={c.type === "number" ? "number" : "text"} inputMode={c.type === "number" ? "numeric" : undefined} value={(form[c.key] as string | undefined) ?? ""} onChange={(e) => set(c.key, e.target.value)} placeholder={c.placeholder} className={c.type === "number" ? numCls : inputCls} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          {/* Date souhaitée d'intervention + consentement démarchage (champs du prospect) */}
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">📅 Date souhaitée d&apos;intervention</p>
              <input type="datetime-local" step={1800} value={dateSouhaitee} onChange={(e) => onSaveDateSouhaitee(e.target.value)}
                className="w-full h-11 px-3 rounded-lg bg-slate-900/60 border border-white/10 text-white text-sm [color-scheme:dark] focus:outline-none focus:border-sky-500/50 transition-colors" />
              <p className="text-slate-500 text-[10px] mt-1">Souhait du client, pré-remplira l&apos;intervention à la conversion.</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">🛡️ Démarchage commercial (RGPD)</p>
              <button type="button" onClick={() => onSaveConsent(!consent)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${consent ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" : "bg-slate-900/60 border-white/10 text-slate-400 hover:border-white/20"}`}>
                <span className="flex items-center gap-1.5">{consent ? <Check className="w-3.5 h-3.5" /> : null}{consent ? "Consentement donné" : "Pas de consentement"}</span>
                <span className="text-xs opacity-70">{consent ? "Retirer" : "Marquer accordé"}</span>
              </button>
            </div>
          </div>
          {/* Remarques = Note interne (même base, synchronisée avec celle du bas de la fiche) */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">📝 Remarques / Note</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onFocus={() => { noteFocused.current = true; }}
              onBlur={() => { noteFocused.current = false; if ((note ?? "") !== (notes ?? "")) onSaveNotes(note); }}
              rows={2}
              placeholder="Remarques, précisions, contexte… (même note qu'en bas de la fiche)"
              className={taCls}
            />
          </div>
          <button type="button" onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-white text-sm font-semibold transition-colors">
            {saving ? "Enregistrement…" : savedFlash ? <><Check className="w-4 h-4" /> Enregistré</> : "Enregistrer la qualification"}
          </button>
        </div>
      )}

      {/* Résumé compact quand fermé + déjà renseigné */}
      {!open && alreadyQualified && (
        <div className="px-4 pb-3 -mt-1 text-xs text-slate-400 space-y-0.5">
          {QUALIF_GROUPS.flatMap((g) => g.champs)
            .filter((c) => c.key !== "note" && (!c.showIf || c.showIf(form)) && ((form[c.key] as string | undefined) ?? "").trim() !== "")
            .slice(0, 6)
            .map((c) => (
              <p key={c.key} className="truncate"><span className="text-slate-500">{c.label} :</span> {form[c.key]}</p>
            ))}
        </div>
      )}
    </div>
  );
}
