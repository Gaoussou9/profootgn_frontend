import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../api/client";

const LiveContext = createContext(null);

export function LiveProvider({ children }) {
  const [liveMatches, setLiveMatches] = useState([]);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const intervalRef = useRef(null);

  const isPageVisible = () =>
    document.visibilityState === "visible";

  const fetchLive = async () => {
    try {
      const res = await api.get("matches/live/");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];

      setLiveMatches(data);
      setIsLiveActive(data.length > 0);

      // 🔥 Si aucun match live → stop polling
      if (data.length === 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // 🔥 Si match live → démarrer polling si pas déjà actif
      if (data.length > 0 && !intervalRef.current) {
        startPolling();
      }
    } catch (err) {
      console.error("Live fetch error:", err.message);
    }
  };

  const startPolling = () => {
    intervalRef.current = setInterval(() => {
      if (!isPageVisible()) return;
      fetchLive();
    }, 60000);
  };

  useEffect(() => {
    fetchLive(); // premier check seulement

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <LiveContext.Provider value={{ liveMatches, isLiveActive }}>
      {children}
    </LiveContext.Provider>
  );
}

export function useLive() {
  return useContext(LiveContext);
}