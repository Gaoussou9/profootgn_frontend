// src/components/UpdateBanner.jsx
import { useEffect, useState } from 'react';

export default function UpdateBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onUpdate = () => setVisible(true);
    window.addEventListener('swUpdated', onUpdate);
    return () => window.removeEventListener('swUpdated', onUpdate);
  }, []);

  if (!visible) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-2 rounded-lg shadow-lg z-50">
      <div className="flex items-center gap-3">
        <span>Nouvelle version disponible</span>
        <button
          className="ml-2 underline"
          onClick={() => {
            // forcer rechargement contrôlé
            if (navigator.serviceWorker.controller) {
              navigator.serviceWorker.controller.postMessage({ action: 'skipWaitingAndReload' });
            }
            window.location.reload();
          }}
        >
          Recharger
        </button>
        <button onClick={() => setVisible(false)} className="ml-2 opacity-80">Ignorer</button>
      </div>
    </div>
  );
}
