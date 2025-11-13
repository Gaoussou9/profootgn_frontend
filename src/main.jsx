// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// ⬇️ Ajout du provider de la fiche joueur
import { PlayerSheetProvider } from "./components/PlayerSheet.jsx";

// ⬇️ Bannière de mise à jour (affichée quand un nouveau SW est installé)
import UpdateBanner from "./components/UpdateBanner.jsx";

const root = createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <PlayerSheetProvider>
      <App />
      <UpdateBanner />
    </PlayerSheetProvider>
  </React.StrictMode>
);

// -----------------------------
// Service Worker registration
// -----------------------------
if ("serviceWorker" in navigator) {
  // register after load to avoid blocking initial paint
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/service-worker.js");
      console.log("Service worker registered:", reg);

      // If there's already a waiting worker, notify app that update is ready
      if (reg.waiting) {
        window.dispatchEvent(new Event("swUpdated"));
      }

      // Listen for new service worker being installed (update found)
      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener("statechange", () => {
          // When the new worker is installed and there's a controlling SW,
          // it means a new version is ready to activate
          if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
            window.dispatchEvent(new Event("swUpdated"));
          }
        });
      });

      // Optional: log when the controller changes (useful for debugging)
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        console.log("Service worker controller changed.");
      });
    } catch (err) {
      console.warn("Service worker registration failed:", err);
    }
  });
}
