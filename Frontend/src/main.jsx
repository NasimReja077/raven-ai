// src/main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/globals.css";
import App from "./App.jsx";

// ── Apply theme before first paint to prevent flash ──────────────────────────
// FIX: App should default to dark mode. We read from localStorage so the
//      user's preference persists across sessions. If nothing is stored we
//      default to "dark" (Raven's brand aesthetic).
const applyTheme = () => {
  const stored = localStorage.getItem("raven-theme");
  const theme = stored ?? "dark"; // ← default is DARK
  document.documentElement.classList.toggle("dark", theme === "dark");
  // Store the default so the toggle knows what state we're in
  if (!stored) localStorage.setItem("raven-theme", "dark");
};

applyTheme();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);