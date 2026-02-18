import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MatchCard from "../components/MatchCard";
import CompetitionMatchCard from "../components/CompetitionMatchCard";

import FAPGAZLogo from "../assets/competitions/FAPGAZ.jpeg";
import LGFFLogo from "../assets/competitions/LGFF.jpeg";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const competitionLogos = {
  2: LGFFLogo,
  1: FAPGAZLogo,
};

export default function CompetitionPage() {
  const { id } = useParams();

  const [competition, setCompetition] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    const controller = new AbortController();

    async function fetchCompetition() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE}/api/competitions/${id}/matches/`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des matchs");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setMatches(data);
          setCompetition(null);
        } else {
          setCompetition(data.competition || null);
          setMatches(data.matches || []);
        }
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCompetition();
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-sm mx-auto p-3 space-y-3 animate-pulse">
        <div className="h-16 rounded-lg bg-gray-200"></div>
        <div className="h-14 rounded-lg bg-gray-200"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 text-sm">
          ❌ {error}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-2 py-2 space-y-3">

      {/* ================= HEADER COMPACT ================= */}
      {competition && (
        <div
          className="
            relative overflow-hidden rounded-lg shadow
            bg-gradient-to-r from-slate-600 via-indigo-600 to-purple-600
            text-white px-3 py-3
          "
        >
          <div className="flex items-center gap-2">

            {/* Logo légèrement agrandi */}
            <div className="w-16 h-16 bg-white/95 rounded-full
                            flex items-center justify-center
                            shadow-sm">

              {competitionLogos[competition.id] ? (
                <img
                  src={competitionLogos[competition.id]}
                  alt={competition.name}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <span className="text-indigo-700 font-bold text-base">
                  {competition.name?.charAt(0)}
                </span>
              )}
            </div>

            <div className="flex-1">

              <h1 className="text-sm sm:text-base font-semibold leading-tight">
                {competition.name}
              </h1>

              {competition.season && (
                <p className="text-indigo-100 text-xs">
                  {competition.season}
                </p>
              )}

              <div className="mt-1">
                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                  {matches.length} matchs
                </span>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= MATCHS ================= */}
      {matches.length === 0 ? (
        <div className="bg-gray-50 border p-3 rounded-md text-center text-gray-500 text-sm">
          Aucun match disponible
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => (
            <div
              key={match.id}
              className="transition duration-200 hover:scale-[1.01]"
            >
              <CompetitionMatchCard match={match} />

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
