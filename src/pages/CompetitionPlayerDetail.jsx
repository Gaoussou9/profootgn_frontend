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

      <div className="relative w-[360px] h-[620px] rounded-3xl shadow-2xl overflow-hidden
                      bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900
                      text-white">

        {/* Bouton retour */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 text-sm opacity-80 hover:opacity-100 z-20"
        >
          ← Retour
        </button>

        {/* Numéro géant en arrière-plan */}
        {player.number && (
          <div className="absolute right-6 top-40 text-[200px] font-bold opacity-10">
            {player.number}
          </div>
        )}

        <div className="p-6 relative z-10">

          {/* Photo */}
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

          {/* Nom */}
          <div className="mt-6">
            <h1 className="text-3xl font-bold uppercase tracking-wide">
              {player.name}
            </h1>
            <p className="text-lg opacity-80">
              {player.position}
            </p>
          </div>

          {/* Infos */}
          <div className="mt-6 space-y-2 text-sm">
            <div>
              <span className="opacity-70">Âge :</span>{" "}
              {player.age || "—"}
            </div>
            <div>
              <span className="opacity-70">Taille :</span>{" "}
              {player.height ? `${player.height} cm` : "—"}
            </div>
            <div>
              <span className="opacity-70">Nationalité :</span>{" "}
              {player.nationality || "—"}
            </div>
          </div>

          {/* Parcours */}
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">
              Parcours
            </h2>

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

        {/* Effet brillance */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-white/0 pointer-events-none" />

      </div>
    </div>
  );
}