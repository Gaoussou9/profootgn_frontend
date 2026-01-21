import { useEffect, useRef, useState } from "react";

export default function MatchCard({ match }) {
  if (!match) return null;

  const {
    home_team,
    away_team,
    home_score,
    away_score,
    status,
    status_label,
    datetime,
    matchday,
  } = match;

  // =========================
  // CHRONO LOCAL (LIVE)
  // =========================
  const [minute, setMinute] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    // Nettoyage systématique
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (status !== "LIVE") {
      setMinute(null);
      return;
    }

    // Départ à 1'
    let currentMinute = 1;
    setMinute(currentMinute);

    intervalRef.current = setInterval(() => {
      currentMinute += 1;
      setMinute(currentMinute);
    }, 60_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status]);

  // =========================
  // SCORE / VS
  // =========================
  const renderScore = () => {
    // Match pas commencé
    if (status === "SCHEDULED") {
      return (
        <span className="text-gray-400 font-semibold">
          vs
        </span>
      );
    }

    // Match en cours → score vert
    if (status === "LIVE") {
      return (
        <span className="text-green-600 font-bold">
          {home_score} - {away_score}
        </span>
      );
    }

    // Autres cas (FT, HT, etc.)
    return (
      <span className="font-semibold">
        {home_score} - {away_score}
      </span>
    );
  };

  // =========================
  // TEMPS / STATUT
  // =========================
  const renderTime = () => {
    if (status === "LIVE" && minute !== null) {
      return (
        <span className="text-red-600 font-semibold">
          LIVE {minute}'
        </span>
      );
    }

    if (status === "HT") return "MT";
    if (status === "FT") return "FT";

    return new Date(datetime).toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow">

      {/* Ligne principale */}
      <div className="flex items-center justify-between">
        

        {/* Équipe domicile */}
        <div className="w-1/3 font-semibold truncate">
          {home_team?.name}
        </div>

        {/* Zone centrale */}
        <div className="flex items-center gap-2 text-lg">

          {home_team?.logo && (
            <img
              src={home_team.logo}
              alt={home_team.name}
              className="w-7 h-7 object-contain"
            />
          )}

          {renderScore()}

          {away_team?.logo && (
            <img
              src={away_team.logo}
              alt={away_team.name}
              className="w-7 h-7 object-contain"
            />
          )}
        </div>

        {/* Équipe extérieure */}
        <div className="w-1/3 text-right font-semibold truncate">
          {away_team?.name}
        </div>
      </div>

      {/* Infos bas */}
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>Journée {matchday}</span>
        <span>{renderTime()}</span>
        <span>{status_label}</span>
      </div>
    </div>
  );
}
