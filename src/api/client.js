// src/api/client.js
import axios from "axios";

/* ---------------------------------------------
   Base URL (supporte 2 noms d'ENV) :
   - VITE_API_BASE_URL (recommandé)
   - VITE_API_BASE      (fallback)
----------------------------------------------*/
const rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://127.0.0.1:8000";

// Trim trailing slashes
const root = String(rawBase).replace(/\/+$/, "");

// Si la base finit déjà par /api (ex: https://x.y/api), on garde /api/
// Sinon on ajoute /api/
const baseURL = /\/api\/?$/i.test(root) ? `${root.replace(/\/+$/, "")}/` : `${root}/api/`;

// ---------------------------------------------
// Instance Axios
// ---------------------------------------------
const api = axios.create({
  baseURL,
  timeout: 15000,
  // withCredentials: true, // ← active si tu utilises cookies/CSRF
});

// ---------------------------------------------
// Request interceptor
// - supprime les slashes de tête sur config.url (évite //)
// - ajoute Bearer token si présent
// - force Accept JSON, et Content-Type JSON sauf FormData / GET
// ---------------------------------------------
api.interceptors.request.use((config) => {
  if (config.url) config.url = config.url.replace(/^\/+/, "");

  const method = String(config.method || "get").toLowerCase();
  const isFormData = typeof FormData !== "undefined" && config.data instanceof FormData;

  const headers = {
    ...(config.headers || {}),
    Accept: "application/json",
    // Évite de poser Content-Type sur GET et FormData (laisse le navigateur gérer les boundaries)
    ...(!isFormData && method !== "get" ? { "Content-Type": "application/json" } : {}),
    // (Optionnel) X-Requested-With pour certains backends
    "X-Requested-With": "XMLHttpRequest",
  };

  // Token localStorage (côté client uniquement)
  try {
    if (typeof window !== "undefined") {
      const t = window.localStorage?.getItem("token");
      if (t) headers.Authorization = `Bearer ${t}`;
    }
  } catch (_) {
    // ignore SSR/localStorage indisponible
  }

  config.headers = headers;
  return config;
});

// ---------------------------------------------
// Response interceptor
// - Normalise les messages d’erreur
// - Expose status (err.status) quand dispo
// ---------------------------------------------
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;

    // Cherche un message pertinent dans plusieurs formats courants (DRF, FastAPI, etc.)
    const candidates = [
      data?.detail,
      data?.message,
      data?.error,
      Array.isArray(data) ? data.join(" | ") : null,
      typeof data === "string" ? data : null,
      err?.message,
      "Erreur réseau",
    ].filter(Boolean);

    const msg = String(candidates[0]);
    const e = new Error(msg);
    if (status) e.status = status;
    return Promise.reject(e);
  }
);

// ---------------------------------------------
// Helpers
// ---------------------------------------------
export const getArr = (res) =>
  Array.isArray(res?.data) ? res.data : res?.data?.results || [];

// ---------------------------------------------
// Endpoints utilisés par MatchDetail.jsx
// (les chemins sont relatifs à baseURL déjà normalisé)
// ---------------------------------------------
export const fetchMatch = (id) => api.get(`matches/${id}/`);
export const fetchMatchTeamInfo = (id) => api.get(`matches/${id}/team-info/`);
export const fetchMatchLineups = (id) => api.get(`matches/${id}/lineups/`);

export default api;
