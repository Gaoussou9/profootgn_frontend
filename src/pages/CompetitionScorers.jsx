import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function CompetitionScorers() {
  const { competitionId } = useParams();
  const [scorers, setScorers] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 AUTO SWITCH LOCAL / PROD
  const API =
    window.location.hostname === "localhost"
      ? "http://127.0.0.1:8000"
      : "https://api.kanousport.com";

  useEffect(() => {
    if (!competitionId) return;

    const fetchScorers = async () => {
      try {
        const res = await fetch(
          `${API}/api/competitions/${competitionId}/top-scorers/`
        );

        if (!res.ok) throw new Error("API error");

        const data = await res.json();
        console.log("DATA:", data);

        setScorers(data.scorers || []);
      } catch (err) {
        console.error("Erreur API:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScorers();
  }, [competitionId]);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-md">

      {/* HEADER */}
      <div className="flex justify-between text-sm text-gray-500 mb-3 px-2">
        <span>#</span>
        <span className="flex-1 ml-4">Joueur</span>

        <div className="flex gap-4">
          <span className="w-8 text-center">⚽</span>
          <span className="w-8 text-center">MJ</span>
          <span className="w-10 text-center">R</span>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-500">Chargement...</p>
      ) : scorers.length === 0 ? (
        <p className="text-gray-500">Aucun buteur pour le moment</p>
      ) : (
        scorers.map((p, i) => (
          <div
            key={p.id}
            className="flex items-center justify-between py-2 px-2 border-b last:border-none hover:bg-gray-50 rounded-lg transition"
          >
            {/* RANK */}
            <span
              className={`font-bold w-6 ${
                i === 0
                  ? "text-yellow-500"
                  : i === 1
                  ? "text-gray-400"
                  : i === 2
                  ? "text-orange-400"
                  : "text-gray-600"
              }`}
            >
              {i + 1}
            </span>

            {/* PLAYER */}
            <div className="flex items-center gap-2 flex-1 ml-2">
              {p.club?.logo && (
                <img
                  src={p.club.logo}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                />
              )}
              <div>
                <div className="font-medium text-sm">{p.name}</div>
                <div className="text-xs text-gray-400">
                  {p.club?.name}
                </div>
              </div>
            </div>

            {/* STATS */}
            <div className="flex items-center gap-4 text-sm">

              {/* GOALS */}
              <span className="font-bold text-green-600 w-8 text-center">
                {p.goals}
              </span>

              {/* MATCHES */}
              <span className="text-gray-600 w-8 text-center">
                {p.matches ?? "-"}
              </span>

              {/* RATIO */}
<span
  className={`text-xs w-10 text-center ${
    p.matches > 0 && p.goals / p.matches > 0.7
      ? "text-green-500"
      : p.matches > 0 && p.goals / p.matches > 0.3
      ? "text-orange-400"
      : "text-gray-400"
  }`}
>
  {p.matches > 0
    ? (p.goals / p.matches).toFixed(2)
    : "-"}
</span>

            </div>
          </div>
        ))
      )}
    </div>
  );
}