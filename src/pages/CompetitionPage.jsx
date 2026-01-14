import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MatchCard from "../components/MatchCard";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function CompetitionPage() {
  const { id } = useParams();

  const [competition, setCompetition] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    setLoading(true);
    setError(null);

    fetch(`${API_BASE}/api/competitions/${id}/matches/`)
      .then(res => {
        if (!res.ok) {
          throw new Error("Erreur lors du chargement des matchs");
        }
        return res.json();
      })
      .then(data => {
        console.log("API PROD DATA:", data);

        setCompetition(data.competition || null);
        setMatches(data.matches || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("API ERROR:", err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Chargement des matchs…</p>;
  if (error) return <p className="text-red-500">Erreur : {error}</p>;

  return (
    <div className="space-y-4">
      {competition && (
        <h1 className="text-xl font-bold mb-4">
          {competition.name}
          {competition.season && ` – ${competition.season}`}
        </h1>
      )}

      {matches.length === 0 ? (
        <p>Aucun match pour cette compétition</p>
      ) : (
        matches.map(match => (
          <MatchCard key={match.id} match={match} />
        ))
      )}
    </div>
  );
}
