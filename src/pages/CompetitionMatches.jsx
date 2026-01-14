// src/pages/CompetitionMatches.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL;

export default function CompetitionMatches() {
  const { id: competitionId } = useParams();

  const [matches, setMatches] = useState(null);
  const [activeDay, setActiveDay] = useState(null); // null = TOUT
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId) return;

    axios
      .get(`${API}/api/competitions/${competitionId}/matches/`)
      .then((res) => {
        console.log("MATCHES API:", res.data);

        // ✅ EXTRACTION CORRECTE DU TABLEAU
        setMatches(res.data.matches || []);
      })
      .catch((err) => {
        console.error("API ERROR", err);
        setError("Erreur lors du chargement des matchs");
        setMatches([]);
      });
  }, [competitionId]);

  if (matches === null) return <p>Chargement…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (matches.length === 0)
    return <p>Aucun match pour cette compétition</p>;

  // Journées uniques + triées
  const matchdays = [...new Set(matches.map((m) => m.matchday))].sort(
    (a, b) => a - b
  );

  // Filtrage par journée
  const filteredMatches =
    activeDay === null
      ? matches
      : matches.filter((m) => m.matchday === activeDay);

  return (
    <div className="space-y-4">
      {/* Filtres journées */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setActiveDay(null)}
          className={`px-4 py-1 rounded-full ${
            activeDay === null ? "bg-black text-white" : "bg-gray-200"
          }`}
        >
          Tout
        </button>

        {matchdays.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-1 rounded-full ${
              activeDay === day ? "bg-black text-white" : "bg-gray-200"
            }`}
          >
            J{day}
          </button>
        ))}
      </div>

      {/* Liste des matchs */}
      <div className="space-y-3">
        {filteredMatches.map((m) => (
          <div
            key={m.id}
            className="bg-white rounded-xl p-4 shadow"
          >
            <div className="flex items-center justify-between font-semibold">
              <span className="w-1/3 text-left">
                {m.home_team?.name}
              </span>

              <span className="text-lg">
                {m.home_score} - {m.away_score}
              </span>

              <span className="w-1/3 text-right">
                {m.away_team?.name}
              </span>
            </div>

            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>J{m.matchday}</span>
              <span>{m.status_label}</span>
              <span>
                {m.datetime
                  ? new Date(m.datetime).toLocaleString()
                  : ""}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
