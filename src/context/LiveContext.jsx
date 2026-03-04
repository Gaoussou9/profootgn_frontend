import { createContext, useContext, useEffect, useRef, useState } from "react";
import api from "../api/client";

const LiveContext = createContext(null);

export function LiveProvider({ children }) {
  const [liveMatches, setLiveMatches] = useState([]);
  const [isLiveActive, setIsLiveActive] = useState(false);

  const intervalRef = useRef(null);
  const fetchingRef = useRef(false);

  const isPageVisible = () => document.visibilityState === "visible";

  const isMatchesPage = () => {
    const path = window.location.pathname;
    return path === "/" || path.includes("journees");
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startPolling = (interval) => {
    stopPolling();

    intervalRef.current = setInterval(() => {
      if (!isPageVisible()) return;
      if (!isMatchesPage()) return;

      fetchLive();
    }, interval);
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

      // fréquence intelligente
      let interval;

      if (data.length > 0) {
        interval = 15000; // match live
      } else {
        interval = 180000; // aucun match live
      }

      startPolling(interval);

    } catch (err) {
      console.error("Live fetch error:", err.message);
    } finally {
      fetchingRef.current = false;
    }
  };

  useEffect(() => {
    if (!isMatchesPage()) return;

    fetchLive();

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