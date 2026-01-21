import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function ClubPage() {
  const { competitionId, clubId } = useParams();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!competitionId || !clubId) return;

    setLoading(true);
    setError(null);

    fetch(`${API}/api/competitions/${competitionId}/clubs/${clubId}/`)
      .then(res => {
        if (!res.ok) throw new Error("Impossible de charger le club");
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [competitionId, clubId]);

  if (loading) return <p className="p-4">Chargement du club…</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!data) return <p className="p-4">Club introuvable</p>;

  const { club, competition, stats } = data;

  return (
    <div className="pb-24">

      {/* ================= HEADER CLUB PRO ================= */}
      <div className="bg-white rounded-b-2xl shadow px-4 pt-5 pb-6">
        <div className="flex items-center gap-4">

          {/* LOGO */}
          {club.logo ? (
            <img
              src={club.logo}
              alt={club.name}
              className="w-16 h-16 object-contain"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200" />
          )}

          {/* INFOS */}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">
              {club.name}
            </h1>

            <p className="text-xs text-gray-500 mt-0.5">
              {club.city || "—"}
            </p>

            <p className="text-xs text-blue-600 font-medium mt-1">
              {competition.name} • {competition.season}
            </p>
          </div>
        </div>

        {/* STATS RAPIDES */}
        <div className="flex justify-around mt-4 text-center">
          <Stat label="Pos" value={stats.position} />
          <Stat label="Pts" value={stats.points} />
          <Stat label="J" value={stats.played} />
          <Stat label="Diff" value={stats.goal_difference} />
        </div>
      </div>

      {/* CONTENU À VENIR */}
      <div className="p-4 text-sm text-gray-500">
        Page club prête.<br />
        Prochaine étape : matchs, effectif, staff.
      </div>
    </div>
  );
}

/* ===== MINI COMPONENT ===== */
function Stat({ label, value }) {
  return (
    <div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px] text-gray-500">{label}</div>
    </div>
  );
}
