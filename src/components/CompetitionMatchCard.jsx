// src/components/CompetitionMatchCard.jsx
import { useNavigate } from "react-router-dom";

export default function CompetitionMatchCard({ match }) {
  const navigate = useNavigate();

  if (!match) return null;

  const {
    id,
    home_team,
    away_team,
    home_score,
    away_score,
    status_label,
    matchday,
  } = match;

  return (
    <div
      onClick={() => navigate(`/match/${id}`)}
      className="
        bg-white rounded-2xl px-4 py-4
        shadow-sm hover:shadow-lg
        transition-all duration-300
        cursor-pointer active:scale-[0.98]
      "
    >
      {/* ================= LIGNE PRINCIPALE ================= */}
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
        <div className="
          flex items-center justify-center gap-3
          text-2xl font-extrabold
          tabular-nums whitespace-nowrap
        ">
          <span
            className={
              home_score > away_score
                ? "text-green-600"
                : "text-gray-900"
            }
          >
            {home_score}
          </span>

          <span className="text-gray-400 text-lg">-</span>

          <span
            className={
              away_score > home_score
                ? "text-green-600"
                : "text-gray-900"
            }
          >
            {away_score}
          </span>
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

      {/* ================= INFOS MATCH ================= */}
      <div className="mt-3 flex justify-between items-center text-xs font-medium">

        <span className="text-gray-500">
          Journée {matchday}
        </span>

        <span
          className={`
            px-2 py-0.5 rounded-full text-[11px] font-semibold
            ${
              status_label === "Live"
                ? "bg-red-100 text-red-600 animate-pulse"
                : status_label === "Terminé"
                ? "bg-gray-100 text-gray-700"
                : "bg-blue-100 text-blue-600"
            }
          `}
        >
          {status_label}
        </span>

      </div>
    </div>
  );
}
