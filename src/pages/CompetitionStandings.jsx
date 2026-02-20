import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FormBadge from "../components/FormBadge";

const API =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function CompetitionStandings() {
  // ✅ CORRECTION ICI
  const { competitionId } = useParams();

  const [competition, setCompetition] = useState(null);
  const [table, setTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId) return;

    setLoading(true);
    setError(null);

    fetch(`${API}/api/competitions/${competitionId}/standings/`)
      .then((res) => {
        if (!res.ok)
          throw new Error("Impossible de charger le classement");
        return res.json();
      })
      .then((data) => {
        setCompetition(data.competition ?? null);
        setTable(data.standings ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [competitionId]);

  if (loading)
    return <p className="text-center py-6">Chargement…</p>;

  if (error)
    return (
      <p className="text-center text-red-500 py-6">
        {error}
      </p>
    );

  if (!table.length)
    return (
      <p className="text-center py-6">
        Aucun classement disponible
      </p>
    );

  return (
    <div className="bg-white rounded-2xl shadow p-3">
      {/* ===== TITRE ===== */}
      {competition && (
        <div className="mb-3">
          <h2 className="text-base font-bold">
            {competition.name}
          </h2>
          <p className="text-xs text-gray-500">
            Saison {competition.season}
          </p>
        </div>
      )}

      {/* ===== TABLE ===== */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px] border-collapse">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="px-1">#</th>
              <th className="text-left px-2">Équipe</th>

              <th className="border-l px-1">J</th>
              <th className="border-l px-1">V</th>
              <th className="border-l px-1">N</th>
              <th className="border-l px-1">D</th>
              <th className="border-l px-1">B</th>
              <th className="border-l px-1">C</th>
              <th className="border-l px-1">Diff</th>
              <th className="border-l px-1 font-bold">Pts</th>
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
                  <td className="text-center font-semibold px-1">
                    {index + 1}
                  </td>

                  {/* ÉQUIPE + FORMES VND */}
                  <td className="px-2 py-2">
                    <div className="flex items-center gap-2">
                      {row.team.logo && (
                        <img
                          src={row.team.logo}
                          alt={row.team.name}
                          className="w-5 h-5 object-contain"
                        />
                      )}

                      <div className="min-w-0">
                        <div className="font-medium truncate max-w-[110px]">
                          {row.team.name}
                        </div>

                        {/* ✅ VND EN COULEUR */}
                        {row.form?.length > 0 && (
                          <div className="flex gap-[2px] mt-1">
                            {row.form.map((f, i) => (
                              <FormBadge key={i} value={f} />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* STATS */}
                  <td className="border-l text-center">
                    {row.played}
                  </td>
                  <td className="border-l text-center">
                    {row.wins}
                  </td>
                  <td className="border-l text-center">
                    {row.draws}
                  </td>
                  <td className="border-l text-center">
                    {row.losses}
                  </td>
                  <td className="border-l text-center">
                    {row.goals_for}
                  </td>
                  <td className="border-l text-center">
                    {row.goals_against}
                  </td>

                  <td
                    className={`border-l text-center font-semibold ${diffColor}`}
                  >
                    {row.goal_difference > 0 && "+"}
                    {row.goal_difference}
                  </td>

                  {/* POINTS */}
                  <td className="border-l text-center font-bold text-blue-600">
                    {row.points}
                    {row.penalty_points > 0 && (
                      <span className="block text-[9px] text-red-500 leading-none">
                        −{row.penalty_points}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
