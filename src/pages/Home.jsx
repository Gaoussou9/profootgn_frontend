import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

/* ---------- Helpers UI ---------- */

const Logo = ({ src, alt, size = "w-9 h-9 sm:w-10 sm:h-10" }) => (
  <img
    src={src || "/club-placeholder.png"}
    alt={alt}
    className={`${size} object-contain shrink-0 rounded-md ring-1 ring-black/10 bg-white`}
    onError={(e) => {
      e.currentTarget.src = "/club-placeholder.png";
    }}
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
   Horloge LIVE partagée
   ---------------------------------------------------------
   On combine 2 sources:
   - Backend:
       live_phase_start (ISO du début de la période en cours)
       live_phase_offset (0 en 1ère MT, 45 en 2e MT)
       current_minute (calc serveur, entier)
   - LocalStorage (par device):
       baseline minute + timestamp de prise du snapshot

   Objectif:
   - Sur un NOUVEL appareil => on utilise live_phase_start/offset (ou current_minute)
     pour démarrer tout de suite à la bonne minute (donc pas 0').
   - Sur le MÊME appareil après refresh => on reprend la baseline sauvée dans localStorage
     donc pas de retour en arrière.
   - À la reprise de 2e MT => on démarre direct à 46', puis ça monte.
   - En pause HT => on reste à 45’+ figé.
   ========================================================= */
function useLiveClock(matchId, status, currentMinuteFromAPI, livePhaseStart, livePhaseOffset) {
  const u = (status || "").toUpperCase();
  const isLive = u === "LIVE";
  const isBreak = u === "HT" || u === "PAUSED";
  const isEnded = u === "FT" || u === "FINISHED";

  // clés de stockage par match
  const baseKey = `gn:clock3:${matchId}`;
  const K_BASE_MIN = `${baseKey}:baseMin`; // minute de référence (déjà "minute affichable")
  const K_BASE_AT = `${baseKey}:baseAt`; // timestamp ms quand on a pris ce snapshot
  const K_STATUS = `${baseKey}:status`; // dernier statut vu ("LIVE", "HT", etc.)

  const [displayMinute, setDisplayMinute] = useState(null);
  const tickRef = useRef(null);

  // utils localStorage
  const readNum = (k) => {
    try {
      const n = Number(localStorage.getItem(k));
      return Number.isFinite(n) ? n : null;
    } catch {
      return null;
    }
  };
  const readStr = (k) => {
    try {
      return localStorage.getItem(k) || null;
    } catch {
      return null;
    }
  };
  const write = (k, v) => {
    try {
      localStorage.setItem(k, String(v));
    } catch {
      /* ignore */
    }
  };
  const clearKeys = () => {
    try {
      localStorage.removeItem(K_BASE_MIN);
      localStorage.removeItem(K_BASE_AT);
      localStorage.removeItem(K_STATUS);
    } catch {
      /* ignore */
    }
  };

  // calcule une minute "serveur fiable" à l’instant T
  // priorité: live_phase_start / live_phase_offset
  // fallback: currentMinuteFromAPI
  const computeServerMinuteNow = () => {
    // si on a live_phase_start + offset on reconstruit la minute absolue
    if (livePhaseStart && Number.isFinite(Number(livePhaseOffset))) {
      const t0 = Date.parse(livePhaseStart);
      if (!Number.isNaN(t0)) {
        const diffMs = Date.now() - t0;
        const playedNow = Math.floor(diffMs / 60000); // minutes écoulées dans la période
        let base = Number(livePhaseOffset) + playedNow; // 0+X ou 45+X

        // sécurités d'affichage foot :
        // - 1ère MT: min >=0
        if (livePhaseOffset < 45 && base < 0) base = 0;
        // - 2e MT: min >=46 dès la reprise
        if (livePhaseOffset >= 45 && base < 46) base = 46;

        return base;
      }
    }

    // sinon, on retombe sur current_minute du backend
    const mSrv = Number(currentMinuteFromAPI);
    if (Number.isFinite(mSrv)) {
      // si serveur envoie encore 45 à la reprise 2e MT, on force 46 mini
      if (mSrv >= 45 && Number(livePhaseOffset) >= 45 && mSrv < 46) {
        return 46;
      }
      return mSrv;
    }

    return null;
  };

  // prend une minute et la "plante" comme baseline locale
  const setBaselineNow = (minuteToSet) => {
    if (!Number.isFinite(minuteToSet)) return;
    write(K_BASE_MIN, minuteToSet);
    write(K_BASE_AT, Date.now());
    write(K_STATUS, u);
  };

  // 1) réagit aux changements de statut / infos serveur
  useEffect(() => {
    const prevStatus = readStr(K_STATUS);

    // match terminé -> fixe, pas de tick
    if (isEnded) {
      clearKeys();
      const mNow = computeServerMinuteNow();
      setDisplayMinute(Number.isFinite(mNow) ? mNow : 90);
      return;
    }

    // mi-temps -> figer à 45’+
    if (isBreak) {
      clearKeys();
      setDisplayMinute(45);
      return;
    }

    // pas LIVE -> rien
    if (!isLive) {
      clearKeys();
      setDisplayMinute(null);
      return;
    }

    // LIVE
    const storedMin = readNum(K_BASE_MIN);
    const storedAt = readNum(K_BASE_AT);
    const srvNow = computeServerMinuteNow();
    const srvValid = Number.isFinite(srvNow) ? srvNow : 0;

    // conditions pour resync baseline:
    //  - pas de baseline
    //  - on vient de passer LIVE après HT/PAUSED/SCHEDULED/etc.
    //  - trop d'écart entre baseline et minute serveur
    const mustReset =
      !Number.isFinite(storedMin) ||
      !Number.isFinite(storedAt) ||
      prevStatus !== "LIVE" ||
      srvValid > storedMin + 2 ||
      srvValid + 2 < storedMin;

    if (mustReset) {
      // si reprise 2e MT, on veut au moins 46'
      let startMinute = srvValid;
      if (
        Number(livePhaseOffset) >= 45 &&
        Number.isFinite(startMinute) &&
        startMinute < 46
      ) {
        startMinute = 46;
      }
      if (Number.isFinite(startMinute)) {
        setBaselineNow(startMinute);
        setDisplayMinute(startMinute);
      } else {
        // fallback si serveur n'a rien donné
        setBaselineNow(0);
        setDisplayMinute(0);
      }
    } else {
      // on reste LIVE, on met juste à jour le dernier statut
      write(K_STATUS, "LIVE");
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, u, currentMinuteFromAPI, livePhaseStart, livePhaseOffset]);

  // 2) tick toutes les secondes tant que LIVE
  useEffect(() => {
    if (!isLive) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }

    const tick = () => {
      const baseMin = readNum(K_BASE_MIN);
      const baseAt = readNum(K_BASE_AT);
      if (!Number.isFinite(baseMin) || !Number.isFinite(baseAt)) {
        const mNow = computeServerMinuteNow();
        setDisplayMinute(Number.isFinite(mNow) ? mNow : null);
        return;
      }

      // minute = baseline + minutes écoulées
      const elapsedMs = Date.now() - baseAt;
      const extraMin = Math.floor(elapsedMs / 60000);
      let mNow = baseMin + extraMin;

      // clamps
      if (mNow < 0) mNow = 0;
      // on ne bloque plus à 45, la 2e MT va monter normalement,
      // mais on protège l'arrêt de jeu fin de match pour l'affichage:
      if (mNow > 130) mNow = 130; // limite débile mais safe

      setDisplayMinute(mNow);
    };

    tick();
    tickRef.current = setInterval(tick, 1000);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchId, isLive, currentMinuteFromAPI, livePhaseStart, livePhaseOffset]);

  return { displayMinute, status: u, live: isLive, breakTime: isBreak };
}

/* Transforme l'état clock -> texte chrono dans le badge */
function formatMinuteForBadge(clock) {
  const { status, displayMinute, live, breakTime } = clock;

  // HT / PAUSED => mi-temps figée
  if (breakTime) {
    return "45’+";
  }

  // pas en direct => pas de chrono
  if (!live) return null;

  if (!Number.isFinite(Number(displayMinute))) return null;

  const n = Number(displayMinute);

  // arrêt de jeu fin 2e MT
  if (n >= 90) return "90’+";

  // arrêt de jeu fin 1re MT
  if (n >= 45 && n < 46) return "45’+";

  // sinon minute normale
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
  const isScheduled = status === "SCHEDULED" || status === "NOT_STARTED";
  const isLive = status === "LIVE";
  const isSuspended = status === "SUSPENDED";
  const isPostponed = status === "POSTPONED";
  const isCanceled = status === "CANCELED" || status === "CANCELLED";

  const homeName =
    m.home_club_name || m.home || m.home_name || m.homeTeam || "Équipe 1";
  const awayName =
    m.away_club_name || m.away || m.away_name || m.awayTeam || "Équipe 2";

  const homeLogo = m.home_club_logo || m.home_logo || m.home_club?.logo || null;
  const awayLogo = m.away_club_logo || m.away_logo || m.away_club?.logo || null;

  // minute de départ côté backend
  const baseMinute = m.current_minute ?? m.minute;

  // on injecte aussi live_phase_start/live_phase_offset ajoutés par _augment_matches_with_clock
  const clock = useLiveClock(
    m.id,
    status,
    baseMinute,
    m.live_phase_start,
    m.live_phase_offset
  );
  const minuteLabel = formatMinuteForBadge(clock);

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
                isSuspended || isCanceled ? "line-through text-gray-400" : ""
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

  // sinon prendre la prochaine journée
  const now = Date.now();
  const ups = (upcoming || [])
    .map((mm) => ({ mm, t: Date.parse(mm.datetime) || Infinity }))
    .filter((x) => Number.isFinite(x.t))
    .sort((a, b) => a.t - b.t);
  const future = ups.find((x) => x.t >= now) || ups[0];
  if (future && matchRoundNum(future.mm) != null) {
    return matchRoundNum(future.mm);
  }

  // sinon la plus récente jouée
  const rec = (recent || [])
    .map((mm) => ({ mm, t: Date.parse(mm.datetime) || 0 }))
    .filter((x) => Number.isFinite(x.t))
    .sort((a, b) => b.t - a.t)[0];
  if (rec && matchRoundNum(rec.mm) != null) {
    return matchRoundNum(rec.mm);
  }

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
        const [rLive, rUpcoming, rRecent, rSusp, rPost, rCanc] = await Promise.all([
          api.get("matches/live/").catch(() => ({ data: [] })),
          api
            .get("matches/upcoming/")
            .catch(() =>
              api.get("matches/?status=SCHEDULED&ordering=datetime&page_size=200")
            ),
          api
            .get("matches/recent/")
            .catch(() =>
              api.get("matches/?status=FT&ordering=-datetime&page_size=200")
            ),
          api
            .get("matches/?status=SUSPENDED&ordering=-datetime&page_size=200")
            .catch(() => ({ data: [] })),
          api
            .get("matches/?status=POSTPONED&ordering=-datetime&page_size=200")
            .catch(() => ({ data: [] })),
          api
            .get("matches/?status=CANCELED&ordering=-datetime&page_size=200")
            .catch(() => ({ data: [] })),
        ]);

        const getArr = (res) =>
          (Array.isArray(res?.data) ? res.data : res?.data?.results) || [];

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
        const [rUpcoming, rRecent, rSusp, rPost, rCanc] = await Promise.all([
          api
            .get("matches/upcoming/")
            .catch(() =>
              api.get("matches/?status=SCHEDULED&ordering=datetime&page_size=200")
            ),
          api
            .get("matches/recent/")
            .catch(() =>
              api.get("matches/?status=FT&ordering=-datetime&page_size=200")
            ),
          api
            .get("matches/?status=SUSPENDED&ordering=-datetime&page_size=200")
            .catch(() => ({ data: [] })),
          api
            .get("matches/?status=POSTPONED&ordering=-datetime&page_size=200")
            .catch(() => ({ data: [] })),
          api
            .get("matches/?status=CANCELED&ordering=-datetime&page_size=200")
            .catch(() => ({ data: [] })),
        ]);

        const getArr = (res) =>
          (Array.isArray(res?.data) ? res.data : res?.data?.results) || [];

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

  // Choisir automatiquement la journée par défaut si pas déjà fixée
  useEffect(() => {
    if (defaultRoundSet.current) return;
    const def = pickDefaultRound({ live, upcoming, recent });
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

  // Fusionner toutes les listes dans un seul feed unique par match.id
  const feed = useMemo(() => {
    const map = new Map();
    const push = (list) => {
      (list || []).forEach((m) => {
        if (!map.has(m.id)) map.set(m.id, m);
      });
    };
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
    return feed.filter((m) => matchRoundNum(m) === Number(round));
  }, [feed, round]);

  // Aide pour trier l'affichage final
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

  // Tri :
  // 1. LIVE/PAUSED/HT tout en haut
  // 2. puis Terminé (FT) les plus récents d'abord
  // 3. puis Prévu les plus proches dans le futur
  // 4. etc.
  const feedSorted = useMemo(() => {
    return [...feedFiltered].sort((a, b) => {
      const ra = statusRank(a.status);
      const rb = statusRank(b.status);
      if (ra !== rb) return ra - rb;

      if (ra === 0) {
        // matches en cours : trier par minute desc (le plus avancé après)
        const am = Number.isFinite(Number(a.current_minute))
          ? Number(a.current_minute)
          : Number(a.minute ?? 0);
        const bm = Number.isFinite(Number(b.current_minute))
          ? Number(b.current_minute)
          : Number(b.minute ?? 0);
        return bm - am;
      }

      if (ra === 1) {
        // terminés : récents d'abord
        return timeMs(b.datetime) - timeMs(a.datetime);
      }

      if (ra === 2) {
        // à venir : plus proche en premier
        return timeMs(a.datetime) - timeMs(b.datetime);
      }

      // fallback
      return timeMs(b.datetime) - timeMs(a.datetime);
    });
  }, [feedFiltered]);

  if (loading) return <p className="px-3">Chargement…</p>;
  if (error) return <p className="px-3 text-red-600">Erreur : {error}</p>;

  return (
    <div className="mx-auto max-w-[480px] px-3 pb-24">
      <section className="space-y-4">
        <header className="flex items-baseline justify-between">
          <h1 className="text-2xl font-bold">Ligue 1 Guinéenne</h1>
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
    </div>
  );
}
