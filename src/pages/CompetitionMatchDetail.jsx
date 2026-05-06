import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import whistleImg from "../assets/whistle.webp";
import bootImg from "../assets/crampon.png";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function CompetitionMatchDetail() {
  const { competitionId, matchId } = useParams();
  const [match, setMatch] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/competitions/${competitionId}/matches/${matchId}/`)
      .then((res) => res.json())
      .then((data) => setMatch(data));
  }, [competitionId, matchId]);

  if (!match) {
    return (
      <p className="text-center py-10">
        Chargement...
      </p>
    );
  }

  const isHomeEvent = (event) =>
    Number(event.team) === Number(match.home_team.id);

  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen overflow-x-hidden">

      {/* HEADER */}
      <div className="bg-green-600 text-white p-4 text-center">

        <div className="flex justify-between items-center gap-2">

          {/* HOME */}
          <div className="text-center flex-1 min-w-0">

            <img
              src={match.home_team.logo}
              className="w-14 h-14 mx-auto object-contain"
            />

            <p className="text-sm sm:text-base leading-tight mt-1 break-words">
              {match.home_team.name}
            </p>

          </div>

          {/* SCORE */}
          <div className="text-xl sm:text-2xl font-bold shrink-0">

            {match.home_score} - {match.away_score}

            <div className="text-sm mt-1">
              {match.status_label}
            </div>

          </div>

          {/* AWAY */}
          <div className="text-center flex-1 min-w-0">

            <img
              src={match.away_team.logo}
              className="w-14 h-14 mx-auto object-contain"
            />

            <p className="text-sm sm:text-base leading-tight mt-1 break-words">
              {match.away_team.name}
            </p>

          </div>

        </div>
      </div>

      {/* EVENTS */}
      <div className="p-4 space-y-8">

        {/* ===================== */}
        {/* ⚽ BUTS */}
        {/* ===================== */}
        <div>

          <h3 className="text-center font-bold text-gray-700 mb-5 text-2xl">
            BUTS
          </h3>

          {[...match.goals]
            .sort((a, b) => a.minute - b.minute)
            .map((g) => {

              const isHome = isHomeEvent(g);

              return (
                <div
                  key={g.id}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-4 bg-white rounded-xl p-3 shadow-sm"
                >

                  {/* HOME */}
                  <div className="min-w-0">

                    {isHome && (

                      <Link
                        to={`/competitions/${competitionId}/clubs/${g.club_id}/players/${g.player_id}`}
                        className="flex items-center gap-2 hover:opacity-80 min-w-0"
                      >

                        {/* PHOTO */}
                        <img
                          src={g.player_photo || "/default.png"}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />

                        {/* TEXT */}
                        <div className="min-w-0">

                          {/* PLAYER */}
                          <p className="text-sm font-semibold truncate flex items-center gap-1">
                            <span className="truncate">
                              {g.player_name}
                            </span>

                            <span>⚽</span>
                          </p>

                          {/* ASSIST */}
                          {g.assist_name && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 truncate">

                              <span className="truncate">
                                {g.assist_name}
                              </span>

                              <img
                                src={bootImg}
                                alt="boot"
                                className="w-4 h-4 object-contain shrink-0"
                              />

                            </p>
                          )}

                          {/* GOAL TYPE */}
                          {g.goal_type !== "normal" && (
                            <p className="text-xs text-orange-600 font-semibold truncate">
                              {g.goal_type_label}
                            </p>
                          )}

                        </div>

                      </Link>

                    )}

                  </div>

                  {/* MINUTE */}
                  <div className="text-center text-green-600 font-bold text-lg px-2 shrink-0">
                    {g.minute}'
                  </div>

                  {/* AWAY */}
                  <div className="min-w-0">

                    {!isHome && (

                      <Link
                        to={`/competitions/${competitionId}/clubs/${g.club_id}/players/${g.player_id}`}
                        className="flex items-center justify-end gap-2 hover:opacity-80 min-w-0"
                      >

                        {/* TEXT */}
                        <div className="text-right min-w-0">

                          {/* PLAYER */}
                          <p className="text-sm font-semibold truncate flex items-center justify-end gap-1">
                            <span className="truncate">
                              {g.player_name}
                            </span>

                            <span>⚽</span>
                          </p>

                          {/* ASSIST */}
                          {g.assist_name && (
                            <p className="text-xs text-gray-500 flex items-center justify-end gap-1 truncate">

                              <span className="truncate">
                                {g.assist_name}
                              </span>

                              <img
                                src={bootImg}
                                alt="boot"
                                className="w-4 h-4 object-contain shrink-0"
                              />

                            </p>
                          )}

                          {/* GOAL TYPE */}
                          {g.goal_type !== "normal" && (
                            <p className="text-xs text-orange-600 font-semibold truncate">
                              {g.goal_type_label}
                            </p>
                          )}

                        </div>

                        {/* PHOTO */}
                        <img
                          src={g.player_photo || "/default.png"}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />

                      </Link>

                    )}

                  </div>

                </div>
              );
            })}
        </div>

        {/* ===================== */}
        {/* 🟨 CARTONS */}
        {/* ===================== */}
        <div>

          <h3 className="text-center font-bold text-gray-700 mb-5 text-2xl">
            CARTONS
          </h3>

          {[...match.cards]
            .sort((a, b) => a.minute - b.minute)
            .map((c) => {

              const isHome = isHomeEvent(c);

              const cardIcon =
                c.color === "red" ? "🟥" : "🟨";

              return (
                <div
                  key={c.id}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 mb-4 bg-white rounded-xl p-3 shadow-sm"
                >

                  {/* HOME */}
                  <div className="min-w-0">

                    {isHome && (

                      <Link
                        to={`/competitions/${competitionId}/clubs/${c.club_id}/players/${c.player_id}`}
                        className="flex items-center gap-2 hover:opacity-80 min-w-0"
                      >

                        {/* PHOTO */}
                        <img
                          src={c.player_photo || "/default.png"}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />

                        {/* TEXT */}
                        <div className="min-w-0">

                          {/* PLAYER */}
                          <p className="text-sm font-semibold truncate flex items-center gap-2">

                            <span className="truncate">
                              {c.player_name}
                            </span>

                            <span>{cardIcon}</span>

                          </p>

                          {/* REASON */}
                          <p className="text-xs text-gray-500 flex items-center gap-1 truncate">

                            <span className="truncate">
                              {c.reason_label}
                            </span>

                            <img
                              src={whistleImg}
                              alt="whistle"
                              className="w-5 h-5 object-contain shrink-0"
                            />

                          </p>

                        </div>

                      </Link>

                    )}

                  </div>

                  {/* MINUTE */}
                  <div className="text-center text-green-600 font-bold text-lg px-2 shrink-0">
                    {c.minute}'
                  </div>

                  {/* AWAY */}
                  <div className="min-w-0">

                    {!isHome && (

                      <Link
                        to={`/competitions/${competitionId}/clubs/${c.club_id}/players/${c.player_id}`}
                        className="flex items-center justify-end gap-2 hover:opacity-80 min-w-0"
                      >

                        {/* TEXT */}
                        <div className="text-right min-w-0">

                          {/* PLAYER */}
                          <p className="text-sm font-semibold truncate flex items-center justify-end gap-2">

                            <span className="truncate">
                              {c.player_name}
                            </span>

                            <span>{cardIcon}</span>

                          </p>

                          {/* REASON */}
                          <p className="text-xs text-gray-500 flex items-center justify-end gap-1 truncate">

                            <span className="truncate">
                              {c.reason_label}
                            </span>

                            <img
                              src={whistleImg}
                              alt="whistle"
                              className="w-5 h-5 object-contain shrink-0"
                            />

                          </p>

                        </div>

                        {/* PHOTO */}
                        <img
                          src={c.player_photo || "/default.png"}
                          className="w-10 h-10 rounded-full object-cover shrink-0"
                        />

                      </Link>

                    )}

                  </div>

                </div>
              );
            })}
        </div>

      </div>
    </div>
  );
}