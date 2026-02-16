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
        console.log("MATCHES API:", res.data);
        setMatches(res.data.matches || []);
      })
      .catch((err) => {
        console.error("API ERROR", err);
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
    <div className="space-y-4">

      {/* FILTRES JOURNÉES */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveDay(null)}
          className={`px-4 py-1 rounded-full text-sm font-medium transition ${
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
            className={`px-4 py-1 rounded-full text-sm font-medium transition ${
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
      <div className="space-y-2">
        {filteredMatches.map((m) => (
          <div
            key={m.id}
            onClick={() => navigate(`/match/${m.id}`)}
            className="bg-white rounded-xl px-4 py-3 
                       border-l-4 border-green-600 
                       shadow-sm hover:shadow-md 
                       transition-all duration-200 
                       cursor-pointer"
          >
            {/* LIGNE PRINCIPALE */}
            <div className="flex items-center justify-between">

              {/* HOME */}
              <div className="flex items-center gap-2 w-2/5 min-w-0">
                <img
                  src={m.home_team?.logo}
                  alt=""
                  className="w-6 h-6 object-contain"
                />
                <span className="text-sm font-semibold truncate">
                  {m.home_team?.name}
                </span>
              </div>

              {/* SCORE DOMINANT */}
              <div className="flex items-center gap-2 text-2xl font-extrabold tracking-tight">
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
              <div className="flex items-center justify-end gap-2 w-2/5 min-w-0 text-right">
                <span className="text-sm font-semibold truncate">
                  {m.away_team?.name}
                </span>
                <img
                  src={m.away_team?.logo}
                  alt=""
                  className="w-6 h-6 object-contain"
                />
              </div>
            </div>

            {/* LIGNE INFO MINIMALISTE */}
            <div className="mt-2 text-[11px] text-gray-500 font-medium">
              J{m.matchday} •{" "}
              <span
                className={`${
                  m.status_label === "Live"
                    ? "text-red-600 animate-pulse"
                    : "text-gray-600"
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
