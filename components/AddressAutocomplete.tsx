"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin } from "lucide-react";

type Suggestion = { label: string; postcode: string; city: string };

/** Champ adresse avec auto-complétion via la Base Adresse Nationale (api-adresse.data.gouv.fr).
 *  Gratuit, sans clé API, adresses françaises. */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder,
  className,
  id,
  name,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (s: Suggestion) => void;
  placeholder?: string;
  className?: string;
  id?: string;
  name?: string;
  required?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleChange(v: string) {
    onChange(v);
    if (timer.current) clearTimeout(timer.current);
    if (v.trim().length < 3) { setSuggestions([]); setOpen(false); return; }
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(v)}&limit=5`);
        const data = await res.json();
        const sugg: Suggestion[] = (data.features ?? []).map((f: { properties: { label: string; postcode: string; city: string } }) => ({
          label: f.properties.label,
          postcode: f.properties.postcode,
          city: f.properties.city,
        }));
        setSuggestions(sugg);
        setOpen(sugg.length > 0);
      } catch { /* hors-ligne : on laisse la saisie libre */ }
    }, 300);
  }

  function pick(s: Suggestion) {
    onChange(s.label);
    onSelect?.(s);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        id={id}
        name={name}
        required={required}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-auto">
          {suggestions.map((s, i) => (
            <li key={i}>
              <button
                type="button"
                onMouseDown={(e) => { e.preventDefault(); pick(s); }}
                className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-sky-50 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5 text-sky-500 flex-shrink-0 mt-0.5" />
                <span className="text-slate-800 text-sm">{s.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
