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
    <div className="space-y-4 px-3 pb-6">

      {/* FILTRES JOURNÉES */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setActiveDay(null)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
            activeDay === null
              ? "bg-black text-white"
              : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Tout
        </button>

        {matchdays.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              activeDay === day
                ? "bg-black text-white"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            J{day}
          </button>
        ))}
      </div>

      {/* LISTE DES MATCHS */}
      <div className="space-y-3">
        {filteredMatches.map((m) => (
          <div
            key={m.id}
            onClick={() => navigate(`/match/${m.id}`)}
            className="bg-white rounded-2xl px-4 py-4 
                       shadow-sm hover:shadow-lg
                       transition-all duration-300
                       cursor-pointer active:scale-[0.98]"
          >

            {/* LIGNE PRINCIPALE */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">

              {/* HOME */}
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={m.home_team?.logo}
                  alt=""
                  className="w-7 h-7 object-contain shrink-0"
                />
                <span className="text-sm font-semibold truncate">
                  {m.home_team?.name}
                </span>
              </div>

              {/* SCORE */}
              <div className="flex items-center justify-center gap-3 
                              text-2xl font-extrabold tabular-nums 
                              whitespace-nowrap">
                <span
                  className={`${
                    m.home_score > m.away_score
                      ? "text-green-600"
                      : "text-gray-900"
                  }`}
                >
                  {m.home_score}
                </span>

                <span className="text-gray-400 text-lg">-</span>

                <span
                  className={`${
                    m.away_score > m.home_score
                      ? "text-green-600"
                      : "text-gray-900"
                  }`}
                >
                  {m.away_score}
                </span>
              </div>

              {/* AWAY */}
              <div className="flex items-center justify-end gap-2 min-w-0">
                <span className="text-sm font-semibold truncate text-right">
                  {m.away_team?.name}
                </span>
                <img
                  src={m.away_team?.logo}
                  alt=""
                  className="w-7 h-7 object-contain shrink-0"
                />
              </div>
            </div>

            {/* INFOS MATCH */}
            <div className="mt-3 flex justify-between items-center text-xs text-gray-500 font-medium">
              <span>J{m.matchday}</span>

              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                  m.status_label === "Live"
                    ? "bg-red-100 text-red-600 animate-pulse"
                    : m.status_label === "Terminé"
                    ? "bg-gray-100 text-gray-700"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {m.status_label}
              </span>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
