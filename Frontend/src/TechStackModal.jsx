import { useEffect } from "react";

export default function TechStackModal({ isOpen, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        backgroundColor: "rgba(0, 0, 0, 0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#000000",
          color: "#ffffff",
          width: "100%",
          maxWidth: "650px",
          maxHeight: "85vh",
          overflowY: "auto",
          padding: "24px",
          border: "1px solid #333333",
          fontFamily: "system-ui, -apple-system, sans-serif",
          fontSize: "14px",
          lineHeight: "1.6",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "18px",
            borderBottom: "1px solid #333333",
            paddingBottom: "10px",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>
            Tech Stack & Libraries
          </h2>
          <button
            onClick={onClose}
            style={{
              backgroundColor: "#000000",
              color: "#ffffff",
              border: "1px solid #ffffff",
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Close
          </button>
        </div>

        <p style={{ margin: "0 0 14px 0" }}>
          Retro Pixel Snooker is an interactive, physics-based retro wallpaper built for the web. It recreates an authentic 90s DOS arcade visual style running in real time at 60 frames per second on the native browser Canvas API, completely free of heavy third-party gaming or physics engines like Three.js, Phaser, or Matter.js.
        </p>

        <p style={{ margin: "0 0 14px 0" }}>
          The frontend is built using React 19 (react and react-dom v19.2.7) for component lifecycle management, reactive overlays, and animation loop bindings. The development server and production build pipeline are powered by Vite 6 (vite v8.1.1 and @vitejs/plugin-react v6.0.3), delivering instant Hot Module Replacement and optimized chunking. Styling utilizes Tailwind CSS v4 (tailwindcss and @tailwindcss/vite v4.3.3) for UI layout, Framer Motion (framer-motion v12.42.2) for motion primitives, and Lucide React (lucide-react v1.25.0) for vector iconography.
        </p>

        <p style={{ margin: "0 0 14px 0" }}>
          The core rendering and physics are written entirely in vanilla JavaScript math. Rendering outputs to an HTML5 2D Canvas buffer at low internal resolution, scaled up using CSS pixelated filtering for sharp pixel-art graphics. Ball textures roll in authentic 3D space using Rodrigues' 3D rotation formula to dynamically compute spherical normal coordinates. Collisions and cushion rebounds are solved using 2D kinematic momentum transfer and elastic impulse equations with tuned restitution coefficients. An interactive Hooke's spring drag mechanic allows balls to be thrown with real momentum, complemented by a dual-stage particle system for collision chalk dust and victory confetti.
        </p>

        <p style={{ margin: "0 0 14px 0" }}>
          Code quality and developer tooling are enforced with ESLint 10 (eslint and @eslint/js v10.6.0) alongside official plugins: eslint-plugin-react-hooks for React Hooks contract validation, eslint-plugin-react-refresh for safe Fast Refresh during development, globals for modern ECMAScript scopes, and TypeScript definitions (@types/react and @types/react-dom) for code intellisense.
        </p>
      </div>
    </div>
  );
}
