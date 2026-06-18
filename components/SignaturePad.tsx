"use client";

import { useRef, useState, useEffect } from "react";
import { RotateCcw } from "lucide-react";

/** Zone de signature tactile (doigt/stylet sur iPad/iPhone via pointer events).
 *  Renvoie l'image PNG (dataURL) à chaque trait, ou null si effacée. */
export default function SignaturePad({ onChange }: { onChange: (dataUrl: string | null) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const [hasSig, setHasSig] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Résolution nette (devicePixelRatio)
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = "#0f172a";
    }
  }, []);

  function point(e: React.PointerEvent) {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function down(e: React.PointerEvent) {
    e.preventDefault();
    canvasRef.current?.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  }

  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const p = point(e);
    if (ctx && last.current) {
      ctx.beginPath();
      ctx.moveTo(last.current.x, last.current.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    last.current = p;
  }

  function up() {
    if (!drawing.current) return;
    drawing.current = false;
    last.current = null;
    setHasSig(true);
    onChange(canvasRef.current?.toDataURL("image/png") ?? null);
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSig(false);
    onChange(null);
  }

  return (
    <div>
      <div className="relative">
        <canvas
          ref={canvasRef}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerLeave={up}
          className="w-full h-40 bg-white border-2 border-slate-300 rounded-xl touch-none"
          style={{ touchAction: "none" }}
        />
        {!hasSig && (
          <span className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm pointer-events-none">
            Signez ici
          </span>
        )}
      </div>
      <button type="button" onClick={clear} className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
        <RotateCcw className="w-3.5 h-3.5" /> Effacer
      </button>
    </div>
  );
}
