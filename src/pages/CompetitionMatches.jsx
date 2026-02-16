// src/pages/CompetitionMatches.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

export default function CompetitionMatches() {
  const { id: competitionId } = useParams();
  const navigate = useNavigate();

  const [matches, setMatches] = useState(null);
  const [activeDay, setActiveDay] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId) return;

    axios
      .get(`${API}/api/competitions/${competitionId}/matches/`)
      .then((res) => {
        setMatches(res.data.matches || []);
      })
      .catch(() => {
        setError("Erreur lors du chargement des matchs");
        setMatches([]);
      });
  }, [competitionId]);

  if (matches === null)
    return <p className="text-center py-6">Chargement…</p>;

  if (error)
    return <p className="text-center text-red-500 py-6">{error}</p>;

  if (matches.length === 0)
    return (
      <p className="text-center text-gray-500 py-6">
        Aucun match pour cette compétition
      </p>
    );

  const matchdays = [...new Set(matches.map((m) => m.matchday))].sort(
    (a, b) => a - b
  );

  const filteredMatches =
    activeDay === null
      ? matches
      : matches.filter((m) => m.matchday === activeDay);

  return (
    <div className="space-y-4 px-2 sm:px-0">

      {/* FILTRES JOURNÉES */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <button
          onClick={() => setActiveDay(null)}
          className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
            activeDay === null
              ? "bg-black text-white"
              : "bg-gray-200"
          }`}
        >
          Tout
        </button>

        {matchdays.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-3 py-1 text-sm rounded-full whitespace-nowrap ${
              activeDay === day
                ? "bg-black text-white"
                : "bg-gray-200"
            }`}
          >
            J{day}
          </button>
        ))}
      </div>

      {/* MATCHS */}
      <div className="space-y-3">
        {filteredMatches.map((m) => (
          <div
            key={m.id}
            onClick={() => navigate(`/match/${m.id}`)}
            className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition cursor-pointer"
          >
            {/* TOP INFO */}
            <div className="flex justify-between items-center text-[11px] text-gray-500 mb-2">
              <span>J{m.matchday}</span>

              <span
                className={`px-2 py-[2px] rounded-full font-semibold
                  ${
                    m.status_label === "Live"
                      ? "bg-red-500 text-white animate-pulse"
                      : "bg-gray-200 text-gray-700"
                  }`}
              >
                {m.status_label}
              </span>

              <span className="hidden sm:block">
                {m.datetime
                  ? new Date(m.datetime).toLocaleString()
                  : ""}
              </span>
            </div>

            {/* MAIN */}
            <div className="flex items-center justify-between">

              {/* HOME */}
              <div className="flex items-center gap-2 w-2/5 min-w-0">
                <img
                  src={m.home_team?.logo}
                  alt=""
                  className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                />
                <span className="text-xs sm:text-sm font-medium truncate">
                  {m.home_team?.name}
                </span>
              </div>

              {/* SCORE */}
              <div className="flex items-center gap-1 text-lg sm:text-xl font-bold">
                <span
                  className={`${
                    m.home_score > m.away_score
                      ? "text-green-600"
                      : "text-gray-800"
                  }`}
                >
                  {m.home_score}
                </span>

                <span className="text-gray-400">-</span>

                <span
                  className={`${
                    m.away_score > m.home_score
                      ? "text-green-600"
                      : "text-gray-800"
                  }`}
                >
                  {m.away_score}
                </span>
              </div>

              {/* AWAY */}
              <div className="flex items-center justify-end gap-2 w-2/5 min-w-0 text-right">
                <span className="text-xs sm:text-sm font-medium truncate">
                  {m.away_team?.name}
                </span>
                <img
                  src={m.away_team?.logo}
                  alt=""
                  className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
