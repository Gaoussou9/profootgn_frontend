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
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen">

      {/* HEADER */}
      <div className="bg-green-600 text-white p-4 text-center">

        <div className="flex justify-between items-center">

          {/* HOME */}
          <div className="text-center">
            <img
              src={match.home_team.logo}
              className="w-12 h-12 mx-auto object-contain"
            />

            <p>{match.home_team.name}</p>
          </div>

          {/* SCORE */}
          <div className="text-2xl font-bold">
            {match.home_score} - {match.away_score}

            <div className="text-sm">
              {match.status_label}
            </div>
          </div>

          {/* AWAY */}
          <div className="text-center">
            <img
              src={match.away_team.logo}
              className="w-12 h-12 mx-auto object-contain"
            />

            <p>{match.away_team.name}</p>
          </div>

        </div>
      </div>

      {/* EVENTS */}
      <div className="p-4 space-y-8">

        {/* ===================== */}
        {/* ⚽ BUTS */}
        {/* ===================== */}
        <div>

          <h3 className="text-center font-bold text-gray-700 mb-4">
            BUTS
          </h3>

          {[...match.goals]
            .sort((a, b) => a.minute - b.minute)
            .map((g) => {

              const isHome = isHomeEvent(g);

              return (
                <div
                  key={g.id}
                  className="flex items-center mb-3"
                >

                  {/* HOME */}
                  <div className="w-5/12">

                    {isHome && (

                      <Link
                        to={`/competitions/${competitionId}/clubs/${g.club_id}/players/${g.player_id}`}
                        className="flex items-center gap-0,3 hover:opacity-80"
                      >

                        {/* PHOTO */}
                        <img
                          src={g.player_photo || "/default.png"}
                          className="w-8 h-8 rounded-full object-cover"
                        />

                        {/* TEXT */}
                        <div>

                          {/* PLAYER */}
                          <p className="text-sm font-semibold whitespace-nowrap">
                            {g.player_name} ⚽
                          </p>

                          {/* ASSIST */}
                          {g.assist_name && (
                            <p className="text-xs text-gray-500 flex items-center gap-0,5 whitespace-nowrap">

                              <span>{g.assist_name}</span>

                              <img
                                src={bootImg}
                                alt="boot"
                                className="w-4 h-4 object-contain"
                              />

                            </p>
                          )}

                          {/* GOAL TYPE */}
                          {g.goal_type !== "normal" && (
                            <p className="text-xs text-orange-600 font-semibold">
                              {g.goal_type_label}
                            </p>
                          )}

                        </div>

                      </Link>

                    )}

                  </div>

                  {/* MINUTE */}
                  <div className="w-2/12 text-center text-green-600 font-bold">
                    {g.minute}'
                  </div>

                  {/* AWAY */}
                  <div className="w-5/12">

                    {!isHome && (

                      <Link
                        to={`/competitions/${competitionId}/clubs/${g.club_id}/players/${g.player_id}`}
                        className="flex items-center justify-end gap-0,5 hover:opacity-80"
                      >

                        {/* PHOTO */}
                        <img
                          src={g.player_photo || "/default.png"}
                          className="w-8 h-8 rounded-full object-cover"
                        />

                        {/* TEXT */}
                        <div className="text-right">

                          {/* PLAYER */}
                          <p className="text-sm font-semibold whitespace-nowrap">
                            {g.player_name} ⚽
                          </p>

                          {/* ASSIST */}
                          {g.assist_name && (
                            <p className="text-xs text-gray-500 flex items-center justify-end gap-1 whitespace-nowrap">

                              <span>{g.assist_name}</span>

                              <img
                                src={bootImg}
                                alt="boot"
                                className="w-4 h-4 object-contain"
                              />

                            </p>
                          )}

                          {/* GOAL TYPE */}
                          {g.goal_type !== "normal" && (
                            <p className="text-xs text-orange-600 font-semibold">
                              {g.goal_type_label}
                            </p>
                          )}

                        </div>

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

          <h3 className="text-center font-bold text-gray-700 mb-4">
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
                  className="flex items-center mb-4"
                >

                  {/* HOME */}
                  <div className="w-5/12">

                    {isHome && (

                      <Link
                        to={`/competitions/${competitionId}/clubs/${c.club_id}/players/${c.player_id}`}
                        className="flex items-center gap-0,5 hover:opacity-80"
                      >

                        {/* PHOTO */}
                        <img
                          src={c.player_photo || "/default.png"}
                          className="w-9 h-9 rounded-full object-cover"
                        />

                        {/* TEXT */}
                        <div>

                          {/* PLAYER */}
                          <p className="text-sm font-semibold flex items-center gap-0,5 whitespace-nowrap">
                            {c.player_name}

                            <span>{cardIcon}</span>
                          </p>

                          {/* REASON */}
                          <p className="text-xs text-gray-500 flex items-center gap-1 whitespace-nowrap">

                            <span>{c.reason_label}</span>

                            <img
                              src={whistleImg}
                              alt="whistle"
                              className="w-5 h-5 object-contain"
                            />

                          </p>

                        </div>

                      </Link>

                    )}

                  </div>

                  {/* MINUTE */}
                  <div className="w-2/12 text-center text-green-600 font-bold">
                    {c.minute}'
                  </div>

                  {/* AWAY */}
                  <div className="w-5/12">

                    {!isHome && (

                      <Link
                        to={`/competitions/${competitionId}/clubs/${c.club_id}/players/${c.player_id}`}
                        className="flex items-center justify-end gap-0,5 hover:opacity-80"
                      >

                        {/* PHOTO */}
                        <img
                          src={c.player_photo || "/default.png"}
                          className="w-9 h-9 rounded-full object-cover"
                        />

                        {/* TEXT */}
                        <div className="text-right">

                          {/* PLAYER */}
                          <p className="text-sm font-semibold flex items-center justify-end gap-1 whitespace-nowrap">

                            {c.player_name}

                            <span>{cardIcon}</span>

                          </p>

                          {/* REASON */}
                          <p className="text-xs text-gray-500 flex items-center justify-end gap-1 whitespace-nowrap">

                            <span>{c.reason_label}</span>

                            <img
                              src={whistleImg}
                              alt="whistle"
                              className="w-5 h-5 object-contain"
                            />

                          </p>

                        </div>

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