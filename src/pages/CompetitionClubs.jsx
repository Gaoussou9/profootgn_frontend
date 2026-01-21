import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;

export default function CompetitionClubs() {
  const { id: competitionId } = useParams();
  const navigate = useNavigate();

  const [competition, setCompetition] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId) return;

    fetch(`${API}/api/competitions/${competitionId}/clubs/`)
      .then(res => {
        if (!res.ok) throw new Error("Impossible de charger les clubs");
        return res.json();
      })
      .then(data => {
        setCompetition(data.competition);
        setClubs(data.clubs || []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [competitionId]);

  if (loading) return <p className="p-4">Chargement…</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4 pb-20">

      {/* TITRE */}
      {competition && (
        <div className="mb-4">
          <h2 className="text-lg font-bold">{competition.name}</h2>
          <p className="text-sm text-gray-500">
            Saison {competition.season}
          </p>
        </div>
      )}

      {/* GRID CLUBS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {clubs.map(club => (
          <button
            key={club.id}
            onClick={() =>
              navigate(
                `/competitions/${competitionId}/clubs/${club.id}`
              )
            }
            className="
              bg-white rounded-lg shadow
              p-3 flex flex-col items-center
              active:scale-95 transition
            "
          >
            {club.logo ? (
              <img
                src={club.logo}
                alt={club.name}
                className="w-14 h-14 object-contain mb-2"
              />
            ) : (
              <div className="w-14 h-14 bg-gray-200 rounded-full mb-2" />
            )}

            <div className="text-xs font-medium text-center truncate w-full">
              {club.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
