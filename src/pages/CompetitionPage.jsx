import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router-dom";
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
  const { competitionId } = useParams();

  const [competition, setCompetition] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ================= FETCH ================= */

  useEffect(() => {
    if (!competitionId) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function fetchCompetition() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `${API_BASE}/api/competitions/${competitionId}/matches/`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des matchs");
        }

        const data = await response.json();

        if (Array.isArray(data)) {
          setCompetition(null);
          setMatches(data);
        } else {
          setCompetition(data?.competition ?? null);
          setMatches(Array.isArray(data?.matches) ? data.matches : []);
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
  }, [competitionId]);

  /* ================= GROUP BY MATCHDAY ================= */

  const groupedMatches = useMemo(() => {
    if (!Array.isArray(matches)) return {};

    return matches.reduce((acc, match) => {
      const day = match.matchday || 0;

      if (!acc[day]) acc[day] = [];
      acc[day].push(match);

      return acc;
    }, {});
  }, [matches]);

  const sortedMatchdays = useMemo(() => {
    return Object.keys(groupedMatches)
      .map(Number)
      .sort((a, b) => a - b); // J1 → J2 → J3
  }, [groupedMatches]);

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <div className="max-w-sm mx-auto p-4 space-y-3 animate-pulse">
        <div className="h-20 rounded-xl bg-gray-200"></div>
        <div className="h-16 rounded-xl bg-gray-200"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-red-500 text-sm">❌ {error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto px-3 py-3 space-y-4">

      {/* ================= HEADER ================= */}

      {competition && (
        <div className="relative overflow-hidden rounded-2xl shadow-lg
                        bg-gradient-to-r from-slate-700 via-indigo-600 to-purple-600
                        text-white px-4 py-4">
          <div className="flex items-center gap-3">

            <div className="w-16 h-16 bg-white/90 rounded-full
                            flex items-center justify-center shadow-md">
              {competitionLogos[competition.id] ? (
                <img
                  src={competitionLogos[competition.id]}
                  alt={competition.name}
                  className="w-12 h-12 object-contain"
                />
              ) : (
                <span className="text-indigo-700 font-bold text-lg">
                  {competition.name?.charAt(0)}
                </span>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-base font-semibold leading-tight">
                {competition.name}
              </h1>

              {competition.season && (
                <p className="text-indigo-100 text-xs">
                  {competition.season}
                </p>
              )}

              <div className="mt-2">
                <span className="bg-white/20 backdrop-blur
                                 px-3 py-1 rounded-full text-xs">
                  {matches.length} matchs
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MATCHS PREMIUM ================= */}

      {sortedMatchdays.length === 0 ? (
        <div className="bg-gray-50 border p-3 rounded-lg text-center text-gray-500 text-sm">
          Aucun match disponible
        </div>
      ) : (
        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory">

          {sortedMatchdays.map((day) => (
            <div
              key={day}
              className="min-w-[280px] snap-start
                         bg-white rounded-2xl shadow-md
                         border border-gray-100
                         flex flex-col"
            >
              {/* HEADER JOURNÉE STICKY */}
              <div className="sticky top-0 z-10
                              bg-gradient-to-r from-indigo-500 to-purple-500
                              text-white
                              px-4 py-2 rounded-t-2xl
                              shadow-sm">
                <h2 className="text-sm font-semibold">
                  Journée {day}
                </h2>
              </div>

              {/* MATCH LIST */}
              <div className="p-3 space-y-3 bg-gray-50 rounded-b-2xl">
                {groupedMatches[day].map((match) => (
                  <div
                    key={match.id}
                    className="transition duration-200
                               hover:scale-[1.02]
                               hover:shadow-lg"
                  >
                    <CompetitionMatchCard
                      match={match}
                      competitionId={competitionId}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

        </div>
      )}
    </div>
  );
}