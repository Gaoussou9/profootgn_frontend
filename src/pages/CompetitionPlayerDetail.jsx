import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function CompetitionPlayerDetail() {
  const { competitionId, clubId, playerId } = useParams();
  const navigate = useNavigate();

  const [player, setPlayer] = useState(null);

  useEffect(() => {
    axios
      .get(
        `${API}/api/competitions/${competitionId}/clubs/${clubId}/players/${playerId}/`
      )
      .then((res) => setPlayer(res.data))
      .catch((err) => console.error(err));
  }, [competitionId, clubId, playerId]);

  if (!player)
    return (
      <div className="h-screen flex items-center justify-center">
        Chargement...
      </div>
    );

  
  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-6">

      <div className="relative w-[360px] h-[650px] rounded-3xl shadow-2xl overflow-hidden
                      bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900
                      text-white">

        {/* 🔥 LOGO TOP */}
        <div className="absolute top-4 right-4 z-20">
          <img
            src="/KanouSport.png"
            alt="KanouSport"
            className="w-10 h-10 object-contain opacity-90 drop-shadow-lg"
          />
        </div>


        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-sm opacity-80 hover:opacity-100 z-20"
        >
          ← Retour
        </button>

        {/* Numéro géant */}
        {player.number && (
          <div className="absolute right-6 top-40 text-[200px] font-bold opacity-10">
            {player.number}
          </div>
        )}

        <div className="p-6 relative z-10">

          {/* PHOTO */}
          <div className="flex justify-center">
            {player.photo ? (
              <img
                src={player.photo}
                alt={player.name}
                className="w-40 h-40 object-cover rounded-2xl border-4 border-white shadow-xl"
              />
            ) : (
              <div className="w-40 h-40 bg-white/20 rounded-2xl" />
            )}
          </div>

          {/* NOM + CLUB */}
          <div className="mt-6 text-center">
            <h1 className="text-2xl font-bold uppercase">
              {player.name}
            </h1>

            <div className="flex items-center justify-center gap-2 mt-1 opacity-80 text-sm">
              {player.club?.logo && (
                <img
                  src={player.club.logo}
                  alt=""
                  className="w-4 h-4 rounded-full"
                />
              )}
              {player.club?.name}
            </div>

            <p className="text-sm opacity-70 mt-1">
              {player.position}
            </p>
          </div>

          {/* STATS */}
          <div className="mt-6 grid grid-cols-4 gap-3 text-center">

            <div className="bg-white/10 rounded-lg py-2">
              <div className="text-lg font-bold">{player.goals}</div>
              <div className="text-xs opacity-70">⚽</div>
            </div>

            <div className="bg-white/10 rounded-lg py-2">
              <div className="text-lg font-bold">{player.assists ?? 0}</div>
              <div className="text-xs opacity-70">🎯</div>
            </div>

            <div className="bg-white/10 rounded-lg py-2">
              <div className="text-lg font-bold">{player.matches_played ?? 0}</div>
              <div className="text-xs opacity-70">MJ</div>
            </div>

            

          </div>

          {/* INFOS */}
          <div className="mt-6 space-y-2 text-sm">
            <div><span className="opacity-70">Âge :</span> {player.age || "—"}</div>
            <div><span className="opacity-70">Taille :</span> {player.height ? `${player.height} cm` : "—"}</div>
            <div><span className="opacity-70">Nationalité :</span> {player.nationality || "—"}</div>
          </div>

          {/* PARCOURS */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Parcours</h2>

            <ul className="text-sm space-y-1 opacity-90">
              {player.previous_club_1 && <li>• {player.previous_club_1}</li>}
              {player.previous_club_2 && <li>• {player.previous_club_2}</li>}
              {player.previous_club_3 && <li>• {player.previous_club_3}</li>}
              {!player.previous_club_1 &&
                !player.previous_club_2 &&
                !player.previous_club_3 && <li>—</li>}
            </ul>
          </div>

        </div>

        {/* Effet lumière */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent pointer-events-none" />

      </div>
    </div>
  );
}