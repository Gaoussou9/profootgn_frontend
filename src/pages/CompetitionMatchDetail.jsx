import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function CompetitionMatchDetail() {
  const { competitionId, matchId } = useParams();

  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId || !matchId) return;

    const controller = new AbortController();

    async function fetchMatch() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE}/api/competitions/${competitionId}/matches/${matchId}/`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Match introuvable");
        }

        const data = await response.json();
        setMatch(data);
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchMatch();
    return () => controller.abort();
  }, [competitionId, matchId]);

  if (loading) {
    return (
      <div className="text-center py-10 animate-pulse">
        Chargement du match...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 py-10">
        ❌ {error}
      </div>
    );
  }

  if (!match) {
    return (
      <div className="text-center py-10">
        Aucun détail disponible
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6 space-y-6">

      <div className="text-center space-y-3">

        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <img
              src={match.home_team?.logo}
              alt=""
              className="w-14 h-14 mx-auto object-contain"
            />
            <p className="font-semibold mt-2">
              {match.home_team?.name}
            </p>
          </div>

          <div className="text-3xl font-extrabold">
            {match.home_score ?? 0} - {match.away_score ?? 0}
          </div>

          <div className="text-center flex-1">
            <img
              src={match.away_team?.logo}
              alt=""
              className="w-14 h-14 mx-auto object-contain"
            />
            <p className="font-semibold mt-2">
              {match.away_team?.name}
            </p>
          </div>
        </div>

        <div className="text-sm text-gray-500">
          Journée {match.matchday} • {match.status_label}
        </div>
      </div>

      <div className="border-t pt-4">
        {(!match.goals || match.goals.length === 0) &&
        (!match.cards || match.cards.length === 0) ? (
          <div className="text-center text-gray-500 text-sm">
            Aucun événement disponible
          </div>
        ) : (
          <div className="space-y-2">
            {match.goals?.map((goal) => (
              <div key={goal.id} className="text-sm">
                ⚽ {goal.player_name} ({goal.minute}')
              </div>
            ))}

            {match.cards?.map((card) => (
              <div key={card.id} className="text-sm">
                🟨 {card.player_name} ({card.minute}')
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
