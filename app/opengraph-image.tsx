import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ClimExpert — Climatisation Île-de-France";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0B1120",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(14,165,233,0.12) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#0EA5E9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 28,
            }}
          >
            ❄️
          </div>
          <span style={{ color: "#fff", fontSize: 36, fontWeight: 700 }}>
            Clim<span style={{ color: "#38BDF8" }}>Expert</span>
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            color: "#fff",
            fontSize: 64,
            fontWeight: 800,
            lineHeight: 1.1,
            margin: 0,
            marginBottom: 24,
            maxWidth: 900,
          }}
        >
          Climatisation{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            haut de gamme
          </span>
          <br />
          en Île-de-France
        </h1>

        {/* Sub */}
        <p style={{ color: "#94A3B8", fontSize: 28, margin: 0, marginBottom: 48 }}>
          Installation · Entretien · Dépannage — Techniciens RGE certifiés
        </p>

        {/* Pills */}
        <div style={{ display: "flex", gap: 16 }}>
          {["Devis gratuit", "Intervention 48h", "7j/7"].map((label) => (
            <div
              key={label}
              style={{
                padding: "12px 24px",
                borderRadius: 50,
                background: "rgba(14,165,233,0.15)",
                border: "1px solid rgba(14,165,233,0.3)",
                color: "#38BDF8",
                fontSize: 22,
                fontWeight: 600,
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
