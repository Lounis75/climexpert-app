"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";

export default function NotesEditorClient({
  id,
  initialNotes,
}: {
  id: string;
  initialNotes: string;
}) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`/api/admin/interventions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="space-y-2">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          autoFocus
          className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-sky-500/50 text-white text-sm placeholder-slate-500 focus:outline-none resize-none"
          placeholder="Accès code porte, matériel nécessaire, observations…"
        />
        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-500/10 border border-sky-500/30 text-sky-400 hover:bg-sky-500/20 text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
          >
            <Check className="w-3.5 h-3.5" /> {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          <button
            onClick={() => { setNotes(initialNotes); setEditing(false); }}
            className="px-3 py-1.5 text-slate-400 hover:text-white text-xs border border-white/10 rounded-lg transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="min-h-[60px] cursor-pointer group relative"
    >
      {notes ? (
        <p className="text-slate-300 text-sm whitespace-pre-wrap">{notes}</p>
      ) : (
        <p className="text-slate-600 text-sm italic">Cliquez pour ajouter des notes…</p>
      )}
      <Pencil className="w-3 h-3 text-slate-600 group-hover:text-slate-400 absolute top-0 right-0 transition-colors" />
    </div>
  );
}
