import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormBadge from "../components/FormBadge";

const API = import.meta.env.VITE_API_BASE_URL;

export default function CompetitionStandings() {
  const { id } = useParams();

  const [competition, setCompetition] = useState(null);
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    fetch(`${API}/api/competitions/${id}/standings/`)
      .then(res => {
        if (!res.ok) throw new Error("Impossible de charger le classement");
        return res.json();
      })
      .then(data => {
        console.log("STANDINGS API:", data); // 🔍 DEBUG
        setCompetition(data.competition);
        setTable(data.standings);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Chargement du classement…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!table.length) return <p>Aucun classement disponible</p>;

  return (
    <div className="bg-white rounded-2xl shadow p-4 overflow-x-auto">

      {/* TITRE */}
      {competition && (
        <div className="mb-4">
          <h2 className="text-lg font-bold">
            {competition.name}
          </h2>
          <p className="text-sm text-gray-500">
            Saison {competition.season}
          </p>
        </div>
      )}

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-gray-500 border-b">
            <th>#</th>
            <th className="text-left">Équipe</th>
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
          {table.map((row, index) => {
            const diffColor =
              row.goal_difference > 0
                ? "text-green-600"
                : row.goal_difference < 0
                ? "text-red-500"
                : "text-gray-500";

            return (
              <tr key={row.team.id} className="border-b last:border-0">
                <td className="text-center font-semibold">{index + 1}</td>

                <td className="py-3">
                  <div className="flex items-center gap-2">
                    {row.team.logo && (
                      <img
                        src={row.team.logo}
                        alt={row.team.name}
                        className="w-6 h-6 object-contain"
                      />
                    )}

                    <div>
                      <div className="font-medium">
                        {row.team.name}
                      </div>

                      {/* 🔥 FORME V/N/D */}
                      {row.form && row.form.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {row.form.map((f, i) => (
                            <FormBadge key={i} value={f} />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </td>

                <td className="text-center">{row.played}</td>
                <td className="text-center">{row.wins}</td>
                <td className="text-center">{row.draws}</td>
                <td className="text-center">{row.losses}</td>
                <td className="text-center">{row.goals_for}</td>
                <td className="text-center">{row.goals_against}</td>

                <td className={`text-center font-semibold ${diffColor}`}>
                  {row.goal_difference > 0 && "+"}
                  {row.goal_difference}
                </td>

                <td className="text-center font-bold text-blue-600">
                  {row.points}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
