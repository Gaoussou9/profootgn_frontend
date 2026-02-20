import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const API =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function CompetitionClubs() {
  // ✅ CORRECTION ICI
  const { competitionId } = useParams();

  const navigate = useNavigate();

  const [competition, setCompetition] = useState(null);
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId) return;

    setLoading(true);
    setError(null);

    fetch(`${API}/api/competitions/${competitionId}/clubs/`)
      .then(res => {
        if (!res.ok) throw new Error("Impossible de charger les clubs");
        return res.json();
      })
      .then(data => {
        setCompetition(data.competition ?? null);
        setClubs(data.clubs ?? []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });

  }, [competitionId]);

  if (loading)
    return <p className="p-4 text-center">Chargement…</p>;

  if (error)
    return (
      <p className="p-4 text-center text-red-500">
        {error}
      </p>
    );

  if (!clubs.length)
    return (
      <p className="p-4 text-center">
        Aucun club disponible
      </p>
    );

  return (
    <div className="px-3 py-3 pb-20 space-y-4">

      {/* HEADER */}
      {competition && (
        <div>
          <h2 className="text-base font-bold">
            {competition.name}
          </h2>
          <p className="text-xs text-gray-500">
            Saison {competition.season}
          </p>
        </div>
      )}

      {/* GRID RESPONSIVE MOBILE OPTIMISÉ */}
      <div className="
        grid
        grid-cols-2
        sm:grid-cols-3
        md:grid-cols-4
        gap-2
      ">
        {clubs.map(club => (
          <button
            key={club.id}
            onClick={() =>
              navigate(
                `/competitions/${competitionId}/clubs/${club.id}`
              )
            }
            className="
              bg-white
              rounded-xl
              shadow-sm
              p-2
              flex flex-col items-center
              active:scale-95
              transition
            "
          >
            {club.logo ? (
              <img
                src={club.logo}
                alt={club.name}
                className="w-12 h-12 object-contain mb-1"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded-full mb-1" />
            )}

            <div className="
              text-[10px]
              font-semibold
              text-center
              leading-tight
              truncate
              w-full
            ">
              {club.name}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
