import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "ClimExpert, Climatisation Île-de-France";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Carte sociale (Open Graph / LinkedIn / WhatsApp...). Couleurs SOLIDES uniquement : le moteur de
// rendu (Satori) ne gère pas le texte en dégradé découpé, ni bien les emojis. Logo dessiné en divs.
export default function OgImage() {
  const pills = ["Devis gratuit", "Intervention 48h", "RGE certifié", "7j/7"];
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0a1020 0%, #0e1d38 55%, #0a1428 100%)",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* Halo lumineux */}
        <div
          style={{
            position: "absolute",
            top: -160,
            right: -120,
            width: 640,
            height: 640,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(14,165,233,0.25) 0%, rgba(14,165,233,0) 70%)",
          }}
        />
        {/* Liseré bas */}
        <div style={{ position: "absolute", left: 0, bottom: 0, width: "100%", height: 8, background: "linear-gradient(90deg, #0EA5E9 0%, #38BDF8 100%)" }} />

        {/* Logo + marque */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: 16,
              background: "linear-gradient(135deg, #38BDF8 0%, #0EA5E9 100%)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              padding: "0 17px",
              boxShadow: "0 10px 34px rgba(14,165,233,0.45)",
            }}
          >
            <div style={{ width: 32, height: 5, borderRadius: 3, background: "#fff", marginBottom: 6 }} />
            <div style={{ width: 24, height: 5, borderRadius: 3, background: "#fff", marginBottom: 6 }} />
            <div style={{ width: 15, height: 5, borderRadius: 3, background: "#fff" }} />
          </div>
          <div style={{ display: "flex", color: "#fff", fontSize: 40, fontWeight: 700 }}>
            <span>Clim</span>
            <span style={{ color: "#38BDF8" }}>Expert</span>
          </div>
        </div>

        {/* Titre + sous-titre */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column", color: "#fff", fontSize: 78, fontWeight: 800, lineHeight: 1.04 }}>
            <span>Climatisation</span>
            <div style={{ display: "flex" }}>
              <span style={{ color: "#fff" }}>en&nbsp;</span>
              <span style={{ color: "#38BDF8" }}>Île-de-France</span>
            </div>
          </div>
          <p style={{ color: "#9fb2c9", fontSize: 31, margin: 0, marginTop: 26 }}>
            Installation · Entretien · Dépannage · Dépose
          </p>
        </div>

        {/* Pills + URL */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 16 }}>
            {pills.map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  padding: "12px 26px",
                  borderRadius: 50,
                  background: "rgba(56,189,248,0.12)",
                  border: "1px solid rgba(56,189,248,0.35)",
                  color: "#7dd3fc",
                  fontSize: 23,
                  fontWeight: 600,
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <span style={{ color: "#64748b", fontSize: 26, fontWeight: 600 }}>climexpert.fr</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
