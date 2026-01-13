import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;
const REFRESH_INTERVAL = 30000; // 30 secondes

export default function CompetitionStandings() {
  const { id } = useParams();

  const [competition, setCompetition] = useState(null);
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStandings = () => {
    fetch(`${API}/api/competitions/${id}/standings/`)
      .then(res => {
        if (!res.ok) {
          throw new Error("Erreur chargement classement");
        }
        return res.json();
      })
      .then(data => {
        setCompetition(data.competition);
        setTable(data.standings || []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    fetchStandings();

    // 🔴 LIVE AUTO-REFRESH
    const interval = setInterval(fetchStandings, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [id]);

  if (loading) return <p>Chargement du classement…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!table.length) return <p>Aucun classement disponible</p>;

  return (
    <div className="bg-white rounded-2xl p-4 shadow overflow-x-auto">

      {/* TITRE */}
      {competition && (
        <div className="mb-4">
          <h2 className="text-xl font-bold">
            {competition.name}
          </h2>
          <p className="text-sm text-gray-500">
            Saison {competition.season}
          </p>
        </div>
      )}

      {/* TABLE */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b text-gray-500">
            <th className="text-left py-2">#</th>
            <th className="text-left py-2">Équipe</th>
            <th>J</th>
            <th>V</th>
            <th>N</th>
            <th>D</th>
            <th>BM</th>
            <th>BC</th>
            <th>Diff</th>
            <th className="font-bold">Pts</th>
          </tr>
        </thead>

        <tbody>
          {table.map(row => (
            <tr
              key={row.team.id}
              className="border-b last:border-0 hover:bg-gray-50 transition"
            >
              <td className="py-2 font-semibold">
                {row.position}
              </td>

              <td className="py-2">
                <div className="flex items-center gap-2">
                  {row.team.logo && (
                    <img
                      src={row.team.logo}
                      alt={row.team.name}
                      className="w-6 h-6 object-contain"
                    />
                  )}
                  <span className="font-medium">
                    {row.team.name}
                  </span>
                </div>
              </td>

              <td className="text-center">{row.played}</td>
              <td className="text-center">{row.wins}</td>
              <td className="text-center">{row.draws}</td>
              <td className="text-center">{row.losses}</td>
              <td className="text-center">{row.goals_for}</td>
              <td className="text-center">{row.goals_against}</td>
              <td className="text-center font-semibold">
                {row.goal_difference}
              </td>

              <td className="text-center font-bold text-blue-700">
                {row.points}
                {row.penalty_points > 0 && (
                  <span className="ml-1 text-xs text-red-600">
                    (-{row.penalty_points})
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* LIVE INDICATOR */}
      <div className="mt-3 text-xs text-gray-500">
        🔴 Classement mis à jour automatiquement
      </div>
    </div>
  );
}
