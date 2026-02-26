import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* =====================================================
   HOOK : Chrono synchronisé serveur
   ===================================================== */
function useLiveMinute(match) {
  const { status, started_at, elapsed_seconds } = match || {};
  const [minute, setMinute] = useState(null);

  useEffect(() => {
    let interval = null;
    const st = (status || "").toUpperCase();

    // Si pas LIVE → pas de chrono dynamique
    if (st !== "LIVE") {
      setMinute(null);
      return;
    }

    const baseSeconds = Number(elapsed_seconds) || 0;

    // Si started_at absent → on affiche juste la base
    if (!started_at) {
      setMinute(Math.floor(baseSeconds / 60));
      return;
    }

    const startMs = Date.parse(started_at);

    const compute = () => {
      const diff = Math.floor((Date.now() - startMs) / 1000);
      const totalSeconds = baseSeconds + diff;
      const m = Math.floor(totalSeconds / 60);
      setMinute(m);
    };

    compute();
    interval = setInterval(compute, 1000);

    return () => clearInterval(interval);
  }, [status, started_at, elapsed_seconds]);

  return minute;
}

/* =====================================================
   Formattage minute football pro
   ===================================================== */
function formatMinute(status, minute) {
  const st = (status || "").toUpperCase();

  if (st === "HT") return "HT";
  if (st === "FT") return "Fin";
  if (st !== "LIVE") return null;
  if (minute == null) return null;

  // 1ère mi-temps
  if (minute < 45) return `${minute}'`;

  // Temps additionnel 1ère MT
  if (minute < 60)
    return minute === 45 ? "45'" : `45+${minute - 45}'`;

  // 2e mi-temps
  if (minute < 90) return `${minute}'`;

  // Temps additionnel 2e MT
  return minute === 90 ? "90'" : `90+${minute - 90}'`;
}

/* =====================================================
   Composant Carte Match
   ===================================================== */
export default function CompetitionMatchCard({ match, competitionId }) {
  const navigate = useNavigate();

  if (!match || !competitionId) return null;

  const {
    id,
    home_team,
    away_team,
    home_score,
    away_score,
    status,
    matchday,
  } = match;

  const st = (status || "").toUpperCase();
  const isLive = st === "LIVE";
  const isHT = st === "HT";
  const isFT = st === "FT";

  const liveMinute = useLiveMinute(match);
  const minuteLabel = formatMinute(status, liveMinute);

  const handleClick = () => {
    navigate(`/competitions/${competitionId}/match/${id}`);
  };

  return (
    <div
      onClick={handleClick}
      className={`
        bg-white rounded-2xl px-4 py-4
        shadow-sm hover:shadow-lg
        transition-all duration-300
        cursor-pointer active:scale-[0.98]
        ${isLive ? "ring-1 ring-red-200" : ""}
      `}
    >
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">

        {/* HOME */}
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={home_team?.logo}
            alt=""
            className="w-7 h-7 object-contain shrink-0"
          />
          <span className="text-sm font-semibold truncate">
            {home_team?.name}
          </span>
        </div>

        {/* SCORE */}
        <div
          className={`
            flex items-center justify-center gap-3
            text-2xl font-extrabold
            tabular-nums whitespace-nowrap
            transition-colors duration-300
            ${isLive ? "text-blue-600" : "text-gray-900"}
          `}
        >
          <span>{home_score}</span>
          <span className="text-gray-400 text-lg">-</span>
          <span>{away_score}</span>
        </div>

        {/* AWAY */}
        <div className="flex items-center justify-end gap-2 min-w-0">
          <span className="text-sm font-semibold truncate text-right">
            {away_team?.name}
          </span>
          <img
            src={away_team?.logo}
            alt=""
            className="w-7 h-7 object-contain shrink-0"
          />
        </div>
      </div>

      {/* FOOTER */}
      <div className="mt-3 flex justify-between items-center text-xs font-medium">
        <span className="text-gray-500">
          Journée {matchday}
        </span>

        {/* BADGE STATUT */}
        {minuteLabel && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-1 rounded-full text-[11px] font-semibold">
            {isLive && (
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>
            )}
            {minuteLabel}
          </div>
        )}

        {!minuteLabel && isHT && (
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-yellow-100 text-yellow-700">
            Mi-temps
          </span>
        )}

        {!minuteLabel && isFT && (
          <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
            Fin
          </span>
        )}
      </div>
    </div>
  );
}