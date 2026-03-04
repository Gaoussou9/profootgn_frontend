import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../api/client";

const LiveContext = createContext(null);

export function LiveProvider({ children }) {
  const [liveMatches, setLiveMatches] = useState([]);
  const [isLiveActive, setIsLiveActive] = useState(false);

  const intervalRef = useRef(null);
  const fetchingRef = useRef(false);

  // Vérifie si l'onglet est visible
  const isPageVisible = () => document.visibilityState === "visible";

  // Vérifie si l'utilisateur est sur la page matchs
  const isMatchesPage = () =>
    window.location.pathname === "/" ||
    window.location.pathname.includes("journees");

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const fetchLive = async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      const res = await api.get("matches/live/");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.results || [];

      setLiveMatches(data);
      setIsLiveActive(data.length > 0);

      // Ajuste le polling selon live ou non
      adjustPolling(data.length > 0);

    } catch (err) {
      console.error("Live fetch error:", err.message);
    } finally {
      fetchingRef.current = false;
    }
  };

  const adjustPolling = (hasLive) => {
    const interval = hasLive ? 30000 : 120000; // 30s si live, sinon 2 min

    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      if (!isPageVisible()) return;
      if (!isMatchesPage()) return;

      fetchLive();
    }, interval);
  };

  useEffect(() => {
    if (!isMatchesPage()) return;

    fetchLive(); // premier check

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchLive();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
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