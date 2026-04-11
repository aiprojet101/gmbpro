import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "GmbPro - Optimisation Google Business automatique";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0A0E1A 0%, #12162B 50%, #1A1F3A 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" stroke="#4F7CFF" strokeWidth="2" />
            <circle cx="16" cy="16" r="9" stroke="#4F7CFF" strokeWidth="1.5" opacity="0.6" />
            <circle cx="16" cy="16" r="2" fill="#4F7CFF" />
          </svg>
          <span style={{ fontSize: 64, fontWeight: 800, color: "#E8ECF4" }}>
            GmbPro
          </span>
        </div>
        <p style={{ fontSize: 28, color: "#8892A8", maxWidth: 700, textAlign: "center", lineHeight: 1.4 }}>
          Optimisation automatique de votre fiche Google Business
        </p>
        <div
          style={{
            display: "flex",
            gap: "32px",
            marginTop: "40px",
          }}
        >
          {[
            { val: "500+", label: "fiches" },
            { val: "+47%", label: "score" },
            { val: "< 24h", label: "delai" },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                padding: "16px 32px",
                borderRadius: "12px",
                background: "rgba(79,124,255,0.1)",
                border: "1px solid rgba(79,124,255,0.2)",
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 800, color: "#4F7CFF" }}>{s.val}</span>
              <span style={{ fontSize: 14, color: "#8892A8" }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
