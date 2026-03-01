// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Provider de la fiche joueur
import { PlayerSheetProvider } from "./components/PlayerSheet.jsx";

const root = createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <PlayerSheetProvider>
      <App />
    </PlayerSheetProvider>
  </React.StrictMode>
);