// src/pages/Home.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

/* ---------- Helpers UI ---------- */

const Logo = ({ src, alt, size = "w-8 h-8" }) => (
  <img
    src={src || "/club-placeholder.png"}
    alt={alt}
    className={`${size} object-contain shrink-0`}
    onError={(e) => (e.currentTarget.src = "/club-placeholder.png")}
  />
);

const statusClasses = (s) => {
  switch ((s || "").toUpperCase()) {
    case "LIVE":
      return "bg-red-100 text-red-700 ring-red-200";
    case "HT":
    case "PAUSED":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "SCHEDULED":
      return "bg-blue-100 text-blue-700 ring-blue-200";
    case "SUSPENDED":
      return "bg-violet-100 text-violet-800 ring-violet-200";
    case "POSTPONED":
      return "bg-yellow-100 text-yellow-800 ring-yellow-200";
    case "CANCELED":
    case "CANCELLED":
      return "bg-gray-200 text-gray-700 ring-gray-300";
    case "FINISHED":
    case "FT":
      return "bg-emerald-100 text-emerald-700 ring-emerald-200";
    default:
      return "bg-gray-100 text-gray-700 ring-gray-200";
  }
};

const statusLabel = (s) => {
  switch ((s || "").toUpperCase()) {
    case "SCHEDULED": return "Prévu";
    case "LIVE":      return "LIVE";
    case "HT":        return "Mi-temps";
    case "PAUSED":    return "Pause";
    case "SUSPENDED": return "Suspendu";
    case "POSTPONED": return "Reporté";
    case "CANCELED":
    case "CANCELLED": return "Annulé";
    case "FT":
    case "FINISHED":  return "Terminé";
    default:          return s || "-";
  }
};

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : "");

/* ---------- Chrono LIVE persistant (fix “45’+ au coup d’envoi”) ---------- */
/**
 * localStorage (par match):
 *  - gn:live:<id>:anchorMs -> timestamp ms (now - minute*60k)
 *  - gn:live:<id>:half2    -> "1" si 2e mi-temps
 *  - gn:live:<id>:lastStat -> dernier statut (LIVE/HT/…)
 *
 * Règles:
 *  - 2e MT est posée UNIQUEMENT:
 *      · à la reprise (HT/PAUSED -> LIVE), ou
 *      · si on arrive en cours avec minute API STRICTEMENT > 45.
 *  - À l’inverse, si minute API < 45 ou démarrage depuis SCHEDULED/NOT_STARTED,
 *      on retire le flag 2e MT.
 *  - Resync vers l’AVANT si l’API a >2’ d’avance. Jamais en arrière.
 *  - FT purge tout.
 */
function useLiveClock(matchId, status, apiMinute) {
  const u = (status || "").toUpperCase();
  const isLive  = u === "LIVE";
  const isBreak = u === "HT" || u === "PAUSED";
  const isEnded = u === "FT" || u === "FINISHED";

  const apiMin = Number.isFinite(Number(apiMinute)) ? Math.max(0, Number(apiMinute)) : 0;

  const base  = `gn:live:${matchId}`;
  const K_A   = `${base}:anchorMs`;
  const K_H2  = `${base}:half2`;
  const K_LST = `${base}:lastStat`;

  const [minute, setMinute] = useState(null);
  const [isSecondHalf, setIsSecondHalf] = useState(false);
  const timerRef = useRef(null);

  const readNum = (k, d=null)=>{ try{const n=Number(localStorage.getItem(k)); return Number.isFinite(n)?n:d;}catch{return d;} };
  const readStr = (k)=>{ try{return localStorage.getItem(k);}catch{return null;} };
  const write   = (k,v)=>{ try{localStorage.setItem(k,String(v));}catch{} };
  const del     = (k)=>{ try{localStorage.removeItem(k);}catch{} };

  const setAnchorFromMinute = (m) => {
    const mm = Math.max(0, Number(m) || 0);
    write(K_A, Date.now() - mm * 60000);
  };

  useEffect(() => {
    const last = readStr(K_LST);
    write(K_LST, u);

    // FT => purge
    if (isEnded) {
      del(K_A); del(K_H2); del(K_LST);
      if (timerRef.current) clearInterval(timerRef.current);
      setMinute(null); setIsSecondHalf(false);
      return;
    }

    // Pause: marque 2e MT et affiche 45'
    if (isBreak) {
      write(K_H2, "1");
      if (timerRef.current) clearInterval(timerRef.current);
      setIsSecondHalf(true);
      setMinute(45);
      return;
    }

    if (!isLive) {
      if (timerRef.current) clearInterval(timerRef.current);
      setMinute(null); setIsSecondHalf(false);
      return;
    }

    // On est LIVE
    const resumedFromBreak = last === "HT" || last === "PAUSED";
    const kickoffFromSched = !last || last === "SCHEDULED" || last === "NOT_STARTED";

    // Déduire/forcer l’état 2e MT
    if (resumedFromBreak || apiMin > 45) {
      write(K_H2, "1");
    } else if (kickoffFromSched || apiMin < 45) {
      // Démarrage de 1re MT ou minute claire <45 -> retirer H2
      del(K_H2);
    }
    const h2 = readStr(K_H2) === "1";
    setIsSecondHalf(h2);

    // (Ré)ancrage
    let anchor = readNum(K_A, null);
    if (anchor == null || resumedFromBreak || kickoffFromSched) {
      let target;
      if (resumedFromBreak) {
        // Reprise officielle : au moins 45, et éviter de repartir à 90 pile
        target = apiMin >= 90 ? 46 : Math.max(45, apiMin);
      } else {
        // Coup d’envoi / refresh en 1re MT
        target = apiMin >= 90 ? 46 : apiMin;
      }
      setAnchorFromMinute(target);
      anchor = readNum(K_A, null);
    }

    // Tick 1s
    if (timerRef.current) clearInterval(timerRef.current);
    const tick = () => {
      const a = readNum(K_A, null);
      if (a == null) return;
      let m = Math.max(0, Math.floor((Date.now() - a) / 60000));
      if (h2 && m < 45) m = 45;           // sécurité 2e MT
      setMinute(m);

      // resync avant-only si l’API est > 2’ devant
      if (apiMin - m > 2) {
        setAnchorFromMinute(apiMin);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, u, apiMin]);

  return { minute, isSecondHalf };
}

/** Badge minute
 * - HT / PAUSED -> "HT"
 * - LIVE:
 *   · 1re MT : 0'…44' puis 45’+
 *   · 2e MT  : 45'…89' puis 90’+
 */
function formatMinuteForBadge(status, minute, isSecondHalf) {
  const u = (status || "").toUpperCase();
  if (u === "HT" || u === "PAUSED") return "HT";
  if (u !== "LIVE") return null;

  const n = Math.max(0, Number(minute ?? 0));
  if (isSecondHalf) return n >= 90 ? "90’+" : `${n}'`;
  return n >= 45 ? "45’+" : `${n}'`;
}

/* ---------- Barre de Journées ---------- */
function MatchdayBar({ selected, onChange, max = 26 }) {
  const items = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      <button
        onClick={() => onChange(null)}
        className={`px-3 py-1.5 rounded-full text-sm ring-1 ${
          selected == null ? "bg-black text-white ring-black" : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50"
        }`}
      >
        Tout
      </button>
      {items.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`px-3 py-1.5 rounded-full text-sm ring-1 ${
            selected === n ? "bg-black text-white ring-black" : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50"
          }`}
        >
          J{n}
        </button>
      ))}
    </div>
  );
}

/* ---------- Carte Match ---------- */
function MatchCard({ m }) {
  const status = (m.status || "").toUpperCase();
  const isScheduled = status === "SCHEDULED" || status === "NOT_STARTED";
  const isLive = status === "LIVE";

  const isSuspended = status === "SUSPENDED";
  const isPostponed = status === "POSTPONED";
  const isCanceled  = status === "CANCELED" || status === "CANCELLED";

  const homeName = m.home_club_name || m.home || m.home_name || m.homeTeam || "Équipe 1";
  const awayName = m.away_club_name || m.away || m.away_name || m.awayTeam || "Équipe 2";
  const homeLogo = m.home_club_logo || m.home_logo || m.home_club?.logo || null;
  const awayLogo = m.away_club_logo || m.away_logo || m.away_club?.logo || null;

  const { minute, isSecondHalf } = useLiveClock(m.id, status, m.minute);
  const minuteLabel = formatMinuteForBadge(status, minute, isSecondHalf);

  return (
    <Link
      to={`/match/${m.id}`}
      className="relative block bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4 hover:shadow-md transition"
    >
      <div className={`absolute right-3 top-3 text-xs px-2 py-1 rounded-full ring-1 ${statusClasses(status)}`}>
        {isLive && <span className="mr-1 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse align-middle" />}
        {statusLabel(status)}
        {minuteLabel ? ` • ${minuteLabel}` : ""}
      </div>

      {m.round_name ? (
        <div className="absolute left-3 top-3 text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-200">
          {m.round_name}
        </div>
      ) : null}

      <div className="grid grid-cols-[1fr,2rem,6rem,2rem,1fr] items-center gap-2 min-h-[68px]">
        <div className="min-w-0 text-right pr-1">
          <span className="font-medium truncate">{homeName}</span>
        </div>
        <div className="justify-self-end">
          <Logo src={homeLogo} alt={homeName} />
        </div>
        <div className="w-[6rem] text-center">
          {isScheduled ? (
            <span className="text-gray-500 font-semibold">vs</span>
          ) : isPostponed ? (
            <span className="text-gray-400 font-semibold">—</span>
          ) : (
            <span className={`text-xl font-extrabold leading-none tabular-nums ${isSuspended || isCanceled ? "line-through text-gray-400" : ""}`}>
              {m.home_score}
              <span className="text-gray-400"> - </span>
              {m.away_score}
            </span>
          )}
        </div>
        <div className="justify-self-start">
          <Logo src={awayLogo} alt={awayName} />
        </div>
        <div className="min-w-0 text-left pl-1">
          <span className="font-medium truncate">{awayName}</span>
        </div>
      </div>

      <div className="text-xs text-gray-500 mt-2">
        {fmtDate(m.datetime)}
        {m.venue ? ` • ${m.venue}` : ""}
      </div>
    </Link>
  );
}

/* ---------- Utils “home default intelligent” ---------- */
const ROUND_KEY = "gn:home:round";

/** Retourne le numéro de journée d’un match (si dispo) */
function matchRoundNum(m) {
  if (m?.round_number != null) return Number(m.round_number);
  if (typeof m?.round === "number") return m.round;
  const tryName = String(m?.round_name || "").replace(/[^\d]/g, "");
  return tryName ? Number(tryName) : null;
}

/** Choix par défaut:
 *  1) s’il y a du LIVE → round le plus fréquent parmi les LIVE
 *  2) sinon match à venir le plus proche (>= now)
 *  3) sinon dernier match terminé le plus récent
 *  4) sinon null (→ “Tout”)
 */
function pickDefaultRound({ live = [], upcoming = [], recent = [] }) {
  // 1) LIVE → round le plus fréquent
  if (Array.isArray(live) && live.length) {
    const counts = new Map();
    for (const m of live) {
      const r = matchRoundNum(m);
      if (r != null) counts.set(r, (counts.get(r) || 0) + 1);
    }
    if (counts.size) {
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
    const one = live.find((m) => matchRoundNum(m) != null);
    if (one) return matchRoundNum(one);
  }

  // 2) Prochain SCHEDULED/NOT_STARTED le plus proche
  const now = Date.now();
  const ups = (upcoming || [])
    .map((m) => ({ m, t: Date.parse(m.datetime) || Infinity }))
    .filter((x) => Number.isFinite(x.t))
    .sort((a, b) => a.t - b.t);

  const future = ups.find((x) => x.t >= now) || ups[0];
  if (future && matchRoundNum(future.m) != null) return matchRoundNum(future.m);

  // 3) Dernier FT/FINISHED le plus récent
  const rec = (recent || [])
    .map((m) => ({ m, t: Date.parse(m.datetime) || 0 }))
    .filter((x) => Number.isFinite(x.t))
    .sort((a, b) => b.t - a.t)[0];

  if (rec && matchRoundNum(rec.m) != null) return matchRoundNum(rec.m);

  // 4) rien trouvé → “Tout”
  return null;
}

/* ---------- Page d’accueil ---------- */

export default function Home() {
  // Filtre journée (null = tout)
  const [round, setRound] = useState(null);

  const [live, setLive] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [suspended, setSuspended] = useState([]);
  const [postponed, setPostponed] = useState([]);
  const [canceled, setCanceled] = useState([]);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState(null);

  // Empêche l'auto-sélection d’écraser le choix utilisateur
  const defaultRoundSet = useRef(false);

  // 0) Lire préférence utilisateur mémorisée
  useEffect(() => {
    const saved = localStorage.getItem(ROUND_KEY);
    if (saved !== null) {
      // "null" (string) signifie “Tout”
      setRound(saved === "null" ? null : Number(saved));
      defaultRoundSet.current = true; // ne pas écraser ensuite
    }
  }, []);

  // 1) Chargement initial
  useEffect(() => {
    let stop = false;
    (async () => {
      setLoad(true);
      try {
        const [rLive, rUpcoming, rRecent, rSusp, rPost, rCanc] = await Promise.all([
          api.get("matches/live/").catch(() => ({ data: [] })),
          api.get("matches/upcoming/").catch(() =>
            api.get("matches/?status=SCHEDULED&ordering=datetime&page_size=200")
          ),
          api.get("matches/recent/").catch(() =>
            api.get("matches/?status=FT&ordering=-datetime&page_size=200")
          ),
          api.get("matches/?status=SUSPENDED&ordering=-datetime&page_size=200").catch(() => ({ data: [] })),
          api.get("matches/?status=POSTPONED&ordering=-datetime&page_size=200").catch(() => ({ data: [] })),
          api.get("matches/?status=CANCELED&ordering=-datetime&page_size=200").catch(() => ({ data: [] })),
        ]);

        const getArr = (res) => Array.isArray(res?.data) ? res.data : res?.data?.results || [];

        if (!stop) {
          setLive(getArr(rLive));
          setUpcoming(getArr(rUpcoming));
          setRecent(getArr(rRecent));
          setSuspended(getArr(rSusp));
          setPostponed(getArr(rPost));
          setCanceled(getArr(rCanc));
          setError(null);
        }
      } catch (e) {
        if (!stop) setError(e.message || "Erreur de chargement");
      } finally {
        if (!stop) setLoad(false);
      }
    })();
    return () => { stop = true; };
  }, []);

  // 2) Refresh périodique (LIVE)
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const r = await api.get("matches/live/");
        const arr = Array.isArray(r.data) ? r.data : r.data.results || [];
        setLive(arr);
      } catch {}
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // 3) Refresh périodique (autres listes)
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const [rUpcoming, rRecent, rSusp, rPost, rCanc] = await Promise.all([
          api.get("matches/upcoming/").catch(() =>
            api.get("matches/?status=SCHEDULED&ordering=datetime&page_size=200")
          ),
          api.get("matches/recent/").catch(() =>
            api.get("matches/?status=FT&ordering=-datetime&page_size=200")
          ),
          api.get("matches/?status=SUSPENDED&ordering=-datetime&page_size=200").catch(() => ({ data: [] })),
          api.get("matches/?status=POSTPONED&ordering=-datetime&page_size=200").catch(() => ({ data: [] })),
          api.get("matches/?status=CANCELED&ordering=-datetime&page_size=200").catch(() => ({ data: [] })),
        ]);
        const getArr = (res) => Array.isArray(res?.data) ? res.data : res?.data?.results || [];
        setUpcoming(getArr(rUpcoming));
        setRecent(getArr(rRecent));
        setSuspended(getArr(rSusp));
        setPostponed(getArr(rPost));
        setCanceled(getArr(rCanc));
      } catch {}
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // 4) Auto-sélection intelligente (si aucun choix utilisateur mémorisé)
  useEffect(() => {
    if (defaultRoundSet.current) return; // ne pas écraser
    const def = pickDefaultRound({ live, upcoming, recent });
    if (def !== null && def !== undefined) {
      setRound(def);
      defaultRoundSet.current = true;
      localStorage.setItem(ROUND_KEY, String(def));
    }
    // si def est null → on reste sur “Tout” sans mémoriser
  }, [live, upcoming, recent]);

  // 5) Gestion du changement utilisateur + mémoire
  const handleRoundChange = (r) => {
    setRound(r);
    defaultRoundSet.current = true; // à partir de maintenant, on respecte son choix
    localStorage.setItem(ROUND_KEY, r === null ? "null" : String(r));
  };

  // Flux unique
  const feed = useMemo(() => {
    const map = new Map();
    const push = (list) => (list || []).forEach((m) => { if (!map.has(m.id)) map.set(m.id, m); });
    push(live);
    push(upcoming);
    push(postponed);
    push(suspended);
    push(canceled);
    push(recent);
    return Array.from(map.values());
  }, [live, upcoming, postponed, suspended, canceled, recent]);

  // Filtre par journée
  const feedFiltered = useMemo(() => {
    if (round == null) return feed;
    return feed.filter((m) => matchRoundNum(m) === Number(round));
  }, [feed, round]);

  // Tri final
  const statusRank = (s) => {
    const uu = (s || "").toUpperCase();
    if (uu === "LIVE" || uu === "HT" || uu === "PAUSED") return 0;
    if (uu === "FT" || uu === "FINISHED") return 1;
    if (uu === "SCHEDULED" || uu === "NOT_STARTED") return 2;
    if (uu === "SUSPENDED") return 3;
    if (uu === "POSTPONED") return 4;
    if (uu === "CANCELED" || uu === "CANCELLED") return 5;
    return 6;
  };
  const timeMs = (d) => { const t = Date.parse(d); return Number.isNaN(t) ? 0 : t; };

  const feedSorted = useMemo(() => {
    return [...feedFiltered].sort((a, b) => {
      const ra = statusRank(a.status);
      const rb = statusRank(b.status);
      if (ra !== rb) return ra - rb;
      if (ra === 0) { // LIVE : plus avancé d’abord
        return Number(b.minute ?? 0) - Number(a.minute ?? 0);
      }
      if (ra === 1) { // FT : plus récent d’abord
        return timeMs(b.datetime) - timeMs(a.datetime);
      }
      if (ra === 2) { // SCHEDULED : le plus proche d’abord
        return timeMs(a.datetime) - timeMs(b.datetime);
      }
      return timeMs(b.datetime) - timeMs(a.datetime);
    });
  }, [feedFiltered]);

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="text-red-600">Erreur : {error}</p>;

  return (
    <section className="space-y-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Ligue 1 Salam</h1>
      </header>

      <MatchdayBar selected={round} onChange={handleRoundChange} max={26} />

      <ul className="grid gap-4">
        {feedSorted.map((m) => (
          <li key={m.id}>
            <MatchCard m={m} />
          </li>
        ))}
      </ul>
    </section>
  );
}
