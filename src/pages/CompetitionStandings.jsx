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

    setLoading(true);
    setError(null);

    fetch(`${API}/api/competitions/${id}/standings/`)
      .then(res => {
        if (!res.ok) {
          throw new Error("Impossible de charger le classement");
        }
        return res.json();
      })
      .then(data => {
        console.log("STANDINGS API:", data);

        setCompetition(data.competition ?? null);
        setTable(data.standings ?? []);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Chargement du classement…</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!table.length) return <p>Aucun classement disponible</p>;

  return (
    <div className="bg-white rounded-2xl shadow p-4 overflow-x-auto">

      {/* ===== TITRE ===== */}
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

      {/* ===== TABLE ===== */}
      <table className="w-full text-xs sm:text-sm border-collapse">
        <thead>
          <tr className="text-gray-500 border-b">
            <th className="px-2">#</th>
            <th className="text-left px-2">Équipe</th>

            <th className="border-l px-2 text-center">J</th>
            <th className="border-l px-2 text-center">V</th>
            <th className="border-l px-2 text-center">N</th>
            <th className="border-l px-2 text-center">D</th>
            <th className="border-l px-2 text-center">BM</th>
            <th className="border-l px-2 text-center">BC</th>
            <th className="border-l px-2 text-center">Diff</th>
            <th className="border-l px-2 text-center font-bold">Pts</th>
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
              <tr
                key={row.team.id}
                className="border-b last:border-0"
              >
                {/* POSITION */}
                <td className="text-center font-semibold px-2">
                  {index + 1}
                </td>

                {/* ÉQUIPE + FORME */}
                <td className="py-3 px-2">
                  <div className="flex items-center gap-2">
                    {row.team.logo && (
                      <img
                        src={row.team.logo}
                        alt={row.team.name}
                        className="w-6 h-6 object-contain"
                      />
                    )}

                    <div>
                      <div className="font-medium truncate">
                        {row.team.name}
                      </div>

                      {/* 🔥 FORME V / N / D */}
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

                {/* STATS */}
                <td className="border-l text-center">{row.played}</td>
                <td className="border-l text-center">{row.wins}</td>
                <td className="border-l text-center">{row.draws}</td>
                <td className="border-l text-center">{row.losses}</td>
                <td className="border-l text-center">{row.goals_for}</td>
                <td className="border-l text-center">{row.goals_against}</td>

                <td className={`border-l text-center font-semibold ${diffColor}`}>
                  {row.goal_difference > 0 && "+"}
                  {row.goal_difference}
                </td>

                {/* ✅ POINTS + PÉNALITÉS */}
                <td className="border-l text-center font-bold text-blue-600">
                  {row.points}
                  {row.penalty_points > 0 && (
                    <span className="ml-1 text-xs text-red-500">
                      (-{row.penalty_points})
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
