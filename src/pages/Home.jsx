import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

/* ---------- Helpers UI ---------- */

const Logo = ({ src, alt, size = "w-9 h-9 sm:w-10 sm:h-10" }) => (
  <img
    src={src || "/club-placeholder.png"}
    alt={alt}
    className={`${size} object-contain shrink-0 rounded-md ring-1 ring-black/10 bg-white`}
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
    case "NOT_STARTED":
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
    case "SCHEDULED":
      return "Prévu";
    case "NOT_STARTED":
      return "À venir";
    case "LIVE":
      return "LIVE";
    case "HT":
      return "Mi-temps";
    case "PAUSED":
      return "Pause";
    case "SUSPENDED":
      return "Suspendu";
    case "POSTPONED":
      return "Reporté";
    case "CANCELED":
    case "CANCELLED":
      return "Annulé";
    case "FT":
    case "FINISHED":
      return "Terminé";
    default:
      return s || "-";
  }
};

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : "");

/* =========================================================
   useServerSyncedMinute
   ---------------------------------------------------------
   On calcule la "minute live" à partir des infos serveur :
   - status
   - live_phase_start (ISO)
   - live_phase_offset (0 ou 45)
   - minute (fallback legacy pour sécurité)

   Règles d'affichage attendues:
   - SCHEDULED -> pas de minute
   - LIVE 1ère MT -> 0',1',2'... puis à partir de 45 -> "45’+"
   - LIVE 2ème MT -> 46',47'... puis à partir de 90 -> "90’+"
   - HT / PAUSED -> "HT"
   - FINISHED/FT -> pas besoin d'animer, plus de minute live dans le badge (on peut afficher le statut seulement)
   ========================================================= */
function useServerSyncedMinute(match) {
  const { status, live_phase_start, live_phase_offset, minute } = match || {};

  const [shownMinute, setShownMinute] = useState(null);

  const tickRef = useRef(null);

  useEffect(() => {
    const st = (status || "").toUpperCase();

    // Arrêt propre du timer précédent
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }

    // Cas mi-temps/pause => figé à 45
    if (st === "HT" || st === "PAUSED") {
      setShownMinute(45);
      return;
    }

    // Match terminé => on n'affiche plus de chrono live
    if (st === "FT" || st === "FINISHED") {
      setShownMinute(null);
      return;
    }

    // Pas LIVE => pas de chrono
    if (st !== "LIVE") {
      setShownMinute(null);
      return;
    }

    // LIVE => on doit animer à partir du serveur
    // On part des champs envoyés par l'API:
    //   live_phase_start (ISO string) : début période
    //   live_phase_offset (number, genre 0 ou 45)
    //
    // Si le backend n'a pas pu envoyer ces infos (None), on retombe
    // sur minute legacy reçue dans le match.
    const phaseStartISO = live_phase_start || null;
    const phaseOffset = Number(live_phase_offset);
    const hasPhaseInfo =
      phaseStartISO &&
      !Number.isNaN(Date.parse(phaseStartISO)) &&
      Number.isFinite(phaseOffset);

    if (!hasPhaseInfo) {
      // fallback: on fige sur match.minute tel quel
      const base = Number(minute);
      setShownMinute(Number.isFinite(base) ? base : null);
      return;
    }

    const phaseStartMs = Date.parse(phaseStartISO);

    const computeMinuteNow = () => {
      const nowMs = Date.now();
      // minutes écoulées dans la phase courante :
      const diffMs = nowMs - phaseStartMs;
      const playedThisPhase = Math.floor(diffMs / 60000);
      let mNow = phaseOffset + playedThisPhase;
      if (mNow < 0) mNow = 0;
      setShownMinute(mNow);
    };

    // tick immédiat + intervalle
    computeMinuteNow();
    tickRef.current = setInterval(computeMinuteNow, 1000);

    return () => {
      if (tickRef.current) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [status, live_phase_start, live_phase_offset, minute]);

  return shownMinute;
}

// Formatteur texte badge chrono
function formatMinuteForBadge(status, rawMinute) {
  const st = (status || "").toUpperCase();

  if (st === "HT" || st === "PAUSED") {
    return "HT";
  }
  if (st !== "LIVE") {
    return null;
  }

  if (!Number.isFinite(Number(rawMinute))) return null;
  const n = Number(rawMinute);

  // Zones + :
  // 45+ pour fin 1ère MT / début 2ème
  if (n >= 90) return "90’+";
  if (n >= 45) return "45’+";

  return `${n}'`;
}

/* ---------- Barre de Journées (scrollable) ---------- */
function MatchdayBar({ selected, onChange, max = 26 }) {
  const items = Array.from({ length: max }, (_, i) => i + 1);
  return (
    <div className="-mx-3 px-3 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-2 pb-2 w-max">
        <button
          onClick={() => onChange(null)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm ring-1 ${
            selected == null
              ? "bg-black text-white ring-black"
              : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50"
          }`}
        >
          Tout
        </button>
        {items.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm ring-1 ${
              selected === n
                ? "bg-black text-white ring-black"
                : "bg-white text-gray-700 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            J{n}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- Carte Match ---------- */
function MatchCard({ m }) {
  const status = (m.status || "").toUpperCase();
  const isScheduled =
    status === "SCHEDULED" || status === "NOT_STARTED";
  const isLive = status === "LIVE";
  const isSuspended = status === "SUSPENDED";
  const isPostponed = status === "POSTPONED";
  const isCanceled =
    status === "CANCELED" || status === "CANCELLED";

  const homeName =
    m.home_club_name ||
    m.home ||
    m.home_name ||
    m.homeTeam ||
    "Équipe 1";
  const awayName =
    m.away_club_name ||
    m.away ||
    m.away_name ||
    m.awayTeam ||
    "Équipe 2";
  const homeLogo =
    m.home_club_logo || m.home_logo || m.home_club?.logo || null;
  const awayLogo =
    m.away_club_logo || m.away_logo || m.away_club?.logo || null;

  // minute calculée côté client à partir des infos serveur
  const liveMinute = useServerSyncedMinute(m);
  const minuteLabel = formatMinuteForBadge(status, liveMinute);

  return (
    <Link
      to={`/match/${m.id}`}
      className="group relative block bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4 hover:shadow-md transition"
    >
      {/* Badge statut / chrono */}
      <div
        className={`absolute right-3 top-3 text-[11px] px-2 py-1 rounded-full ring-1 ${statusClasses(
          status
        )}`}
      >
        {isLive && (
          <span className="mr-1 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse align-middle" />
        )}
        {statusLabel(status)}
        {minuteLabel ? ` • ${minuteLabel}` : ""}
      </div>

      {/* Badge journée */}
      {m.round_name && (
        <div className="absolute left-3 top-3 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 ring-1 ring-gray-200">
          {m.round_name}
        </div>
      )}

      {/* Grille clubs / score */}
      <div className="grid grid-cols-[1fr,auto,4.5rem,auto,1fr] sm:grid-cols-[1fr,auto,5rem,auto,1fr] items-center gap-2 min-h-[68px]">
        {/* Home side */}
        <div className="min-w-0 text-right pr-1">
          <span
            className="block team-name font-medium text-gray-900 no-underline group-hover:underline decoration-gray-300"
            title={homeName}
          >
            {homeName}
          </span>
        </div>

        <div className="justify-self-end">
          <Logo src={homeLogo} alt={homeName} />
        </div>

        {/* Score */}
        <div className="w-[4.5rem] sm:w-[5rem] text-center">
          {isScheduled ? (
            <span className="text-gray-500 font-semibold">vs</span>
          ) : isPostponed ? (
            <span className="text-gray-400 font-semibold">—</span>
          ) : (
            <span
              className={`text-xl sm:text-2xl font-extrabold leading-none tabular-nums ${
                isSuspended || isCanceled
                  ? "line-through text-gray-400"
                  : ""
              }`}
            >
              {m.home_score}
              <span className="text-gray-400"> - </span>
              {m.away_score}
            </span>
          )}
        </div>

        <div className="justify-self-start">
          <Logo src={awayLogo} alt={awayName} />
        </div>

        {/* Away side */}
        <div className="min-w-0 text-left pl-1">
          <span
            className="block team-name font-medium text-gray-900 no-underline group-hover:underline decoration-gray-300"
            title={awayName}
          >
            {awayName}
          </span>
        </div>
      </div>

      <div className="text-[12px] text-gray-500 mt-2">
        {fmtDate(m.datetime)}
        {m.venue ? ` • ${m.venue}` : ""}
      </div>
    </Link>
  );
}

/* ---------- Utils ---------- */
const ROUND_KEY = "gn:home:round";

function matchRoundNum(m) {
  if (m?.round_number != null) return Number(m.round_number);
  if (typeof m?.round === "number") return m.round;
  const tryName = String(m?.round_name || "").replace(/[^\d]/g, "");
  return tryName ? Number(tryName) : null;
}

function pickDefaultRound({ live = [], upcoming = [], recent = [] }) {
  // priorité : journée où ça joue en live
  if (Array.isArray(live) && live.length) {
    const counts = new Map();
    for (const mm of live) {
      const r = matchRoundNum(mm);
      if (r != null) counts.set(r, (counts.get(r) || 0) + 1);
    }
    if (counts.size) {
      return [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
    }
    const one = live.find((mm) => matchRoundNum(mm) != null);
    if (one) return matchRoundNum(one);
  }

  // sinon : la prochaine journée
  const now = Date.now();
  const ups = (upcoming || [])
    .map((mm) => ({ mm, t: Date.parse(mm.datetime) || Infinity }))
    .filter((x) => Number.isFinite(x.t))
    .sort((a, b) => a.t - b.t);

  const future = ups.find((x) => x.t >= now) || ups[0];
  if (future && matchRoundNum(future.mm) != null)
    return matchRoundNum(future.mm);

  // sinon : la dernière jouée
  const rec = (recent || [])
    .map((mm) => ({ mm, t: Date.parse(mm.datetime) || 0 }))
    .filter((x) => Number.isFinite(x.t))
    .sort((a, b) => b.t - a.t)[0];
  if (rec && matchRoundNum(rec.mm) != null)
    return matchRoundNum(rec.mm);

  return null;
}

/* ---------- Page d’accueil ---------- */
export default function Home() {
  const [round, setRound] = useState(null);

  const [live, setLive] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [suspended, setSuspended] = useState([]);
  const [postponed, setPostponed] = useState([]);
  const [canceled, setCanceled] = useState([]);

  const [loading, setLoad] = useState(true);
  const [error, setError] = useState(null);

  const defaultRoundSet = useRef(false);

  // Charger round préféré depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem(ROUND_KEY);
    if (saved !== null) {
      setRound(saved === "null" ? null : Number(saved));
      defaultRoundSet.current = true;
    }
  }, []);

  // Premier fetch (live / upcoming / recent / états spéciaux)
  useEffect(() => {
    let stop = false;
    (async () => {
      setLoad(true);
      try {
        const [rLive, rUpcoming, rRecent, rSusp, rPost, rCanc] =
          await Promise.all([
            api.get("matches/live/").catch(() => ({ data: [] })),
            api
              .get("matches/upcoming/")
              .catch(() =>
                api.get(
                  "matches/?status=SCHEDULED&ordering=datetime&page_size=200"
                )
              ),
            api
              .get("matches/recent/")
              .catch(() =>
                api.get(
                  "matches/?status=FT&ordering=-datetime&page_size=200"
                )
              ),
            api
              .get(
                "matches/?status=SUSPENDED&ordering=-datetime&page_size=200"
              )
              .catch(() => ({ data: [] })),
            api
              .get(
                "matches/?status=POSTPONED&ordering=-datetime&page_size=200"
              )
              .catch(() => ({ data: [] })),
            api
              .get(
                "matches/?status=CANCELED&ordering=-datetime&page_size=200"
              )
              .catch(() => ({ data: [] })),
          ]);

        const getArr = (res) =>
          (Array.isArray(res?.data)
            ? res.data
            : res?.data?.results) || [];

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
    return () => {
      stop = true;
    };
  }, []);

  // Poll LIVE toutes les 15s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const r = await api.get("matches/live/");
        const arr = Array.isArray(r.data) ? r.data : r.data.results || [];
        setLive(arr);
      } catch {
        /* ignore */
      }
    }, 15000);
    return () => clearInterval(id);
  }, []);

  // Poll autres listes toutes les 30s
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const [rUpcoming, rRecent, rSusp, rPost, rCanc] =
          await Promise.all([
            api
              .get("matches/upcoming/")
              .catch(() =>
                api.get(
                  "matches/?status=SCHEDULED&ordering=datetime&page_size=200"
                )
              ),
            api
              .get("matches/recent/")
              .catch(() =>
                api.get(
                  "matches/?status=FT&ordering=-datetime&page_size=200"
                )
              ),
            api
              .get(
                "matches/?status=SUSPENDED&ordering=-datetime&page_size=200"
              )
              .catch(() => ({ data: [] })),
            api
              .get(
                "matches/?status=POSTPONED&ordering=-datetime&page_size=200"
              )
              .catch(() => ({ data: [] })),
            api
              .get(
                "matches/?status=CANCELED&ordering=-datetime&page_size=200"
              )
              .catch(() => ({ data: [] })),
          ]);
        const getArr = (res) =>
          (Array.isArray(res?.data)
            ? res.data
            : res?.data?.results) || [];
        setUpcoming(getArr(rUpcoming));
        setRecent(getArr(rRecent));
        setSuspended(getArr(rSusp));
        setPostponed(getArr(rPost));
        setCanceled(getArr(rCanc));
      } catch {
        /* ignore */
      }
    }, 30000);
    return () => clearInterval(id);
  }, []);

  // Choisir la journée par défaut
  useEffect(() => {
    if (defaultRoundSet.current) return;
    const def = pickDefaultRound({
      live,
      upcoming,
      recent,
    });
    if (def !== null && def !== undefined) {
      setRound(def);
      defaultRoundSet.current = true;
      localStorage.setItem(ROUND_KEY, String(def));
    }
  }, [live, upcoming, recent]);

  const handleRoundChange = (r) => {
    setRound(r);
    defaultRoundSet.current = true;
    localStorage.setItem(ROUND_KEY, r === null ? "null" : String(r));
  };

  // Fusionner toutes les listes
  const feed = useMemo(() => {
    const map = new Map();
    const push = (list) =>
      (list || []).forEach((m) => {
        if (!map.has(m.id)) map.set(m.id, m);
      });
    push(live);
    push(upcoming);
    push(postponed);
    push(suspended);
    push(canceled);
    push(recent);
    return Array.from(map.values());
  }, [live, upcoming, postponed, suspended, canceled, recent]);

  // Filtrer par journée sélectionnée
  const feedFiltered = useMemo(() => {
    if (round == null) return feed;
    return feed.filter(
      (m) => matchRoundNum(m) === Number(round)
    );
  }, [feed, round]);

  // Aide pour trier l'affichage
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
  const timeMs = (d) => {
    const t = Date.parse(d);
    return Number.isNaN(t) ? 0 : t;
  };

  // Tri (LIVE en haut, puis récents, etc.)
  const feedSorted = useMemo(() => {
    return [...feedFiltered].sort((a, b) => {
      const ra = statusRank(a.status);
      const rb = statusRank(b.status);
      if (ra !== rb) return ra - rb;

      // Pour LIVE : garder l'ordre par minute courante (desc)
      if (ra === 0) {
        const am = Number.isFinite(Number(a.minute))
          ? Number(a.minute)
          : 0;
        const bm = Number.isFinite(Number(b.minute))
          ? Number(b.minute)
          : 0;
        return bm - am;
      }

      // Pour FT : les plus récents en premier
      if (ra === 1) {
        return timeMs(b.datetime) - timeMs(a.datetime);
      }

      // Pour SCHEDULED : les plus proches d'abord
      if (ra === 2) {
        return timeMs(a.datetime) - timeMs(b.datetime);
      }

      // Fallback
      return timeMs(b.datetime) - timeMs(a.datetime);
    });
  }, [feedFiltered]);

  if (loading) return <p className="px-3">Chargement…</p>;
  if (error)
    return (
      <p className="px-3 text-red-600">Erreur : {error}</p>
    );

  return (
    <div className="mx-auto max-w-[480px] px-3 pb-24">
      <section className="space-y-4">
        <header className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">
            Ligue 1 Guinéenne
          </h1>
        </header>

        <MatchdayBar
          selected={round}
          onChange={handleRoundChange}
          max={26}
        />

        <ul className="grid gap-4">
          {feedSorted.map((m) => (
            <li key={m.id}>
              <MatchCard m={m} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
