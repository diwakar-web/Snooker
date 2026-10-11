export default function Header({ onOpenInfo }) {
  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 30,
        pointerEvents: "none",
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        userSelect: "none",
      }}
    >
      {/* Title */}
      <div style={{ pointerEvents: "auto" }}>
        <span
          style={{
            color: "#ffffff",
            fontSize: "13px",
            fontWeight: 600,
            textShadow: "0 1px 3px rgba(0,0,0,0.9)",
          }}
        >
          Retro Snooker
        </span>
      </div>

      {/* Top Right: Normal Info Button */}
      <div style={{ pointerEvents: "auto" }}>
        <button
          onClick={onOpenInfo}
          style={{
            backgroundColor: "#000000",
            color: "#ffffff",
            border: "1px solid #ffffff",
            padding: "4px 12px",
            fontSize: "12px",
            cursor: "pointer",
            borderRadius: "4px",
          }}
          title="Info"
          aria-label="Info"
        >
          Info
        </button>
      </div>
    </header>
  );
}
