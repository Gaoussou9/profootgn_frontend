// src/main.jsx (ou src/index.jsx selon ton projet)
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// ⬇️ Ajout du provider de la fiche joueur
import { PlayerSheetProvider } from './components/PlayerSheet.jsx';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PlayerSheetProvider>
      <App />
    </PlayerSheetProvider>
  </React.StrictMode>
);
