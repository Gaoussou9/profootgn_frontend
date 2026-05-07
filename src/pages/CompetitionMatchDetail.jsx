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

    fetch(
      `${API_BASE}/api/competitions/${competitionId}/matches/${matchId}/`
    )
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

  // =========================
  // ABRÉGER NOMS
  // =========================

  function abbreviateName(name) {

    if (!name) return "";

    const parts = name
      .trim()
      .split(" ")
      .filter(Boolean);

    if (parts.length === 1) {
      return parts[0];
    }

    if (parts.length === 2) {
      return `${parts[0][0]}. ${parts[1]}`;
    }

    const lastName = parts[parts.length - 1];

    const initials = parts
      .slice(0, -1)
      .map((p) => `${p[0]}.`)
      .join(" ");

    return `${initials} ${lastName}`;
  }

  return (

    <div className="max-w-md mx-auto bg-gray-100 min-h-screen">

      {/* ========================= */}
      {/* HEADER */}
      {/* ========================= */}

      <div className="bg-green-600 text-white p-4">

        <div className="flex justify-between items-center">

          {/* HOME */}
          <div className="text-center w-24">

            <img
              src={match.home_team.logo}
              alt={match.home_team.name}
              className="w-12 h-12 mx-auto object-contain"
            />

            <p className="text-sm mt-2 leading-tight">
              {match.home_team.name}
            </p>

          </div>

          {/* SCORE */}
          <div className="text-center">

            <div className="text-4xl font-bold">
              {match.home_score} - {match.away_score}
            </div>

            <div className="text-lg font-semibold">
              {match.status_label}
            </div>

          </div>

          {/* AWAY */}
          <div className="text-center w-24">

            <img
              src={match.away_team.logo}
              alt={match.away_team.name}
              className="w-12 h-12 mx-auto object-contain"
            />

            <p className="text-sm mt-2 leading-tight">
              {match.away_team.name}
            </p>

          </div>

        </div>

      </div>

      {/* ========================= */}
      {/* EVENTS */}
      {/* ========================= */}

      <div className="p-3 space-y-8">

        {/* ========================= */}
        {/* BUTS */}
        {/* ========================= */}

        <div>

          <h2 className="text-center text-2xl font-bold text-gray-700 mb-5">
            BUTS
          </h2>

          <div className="space-y-3">

            {[...match.goals]
              .sort((a, b) => a.minute - b.minute)
              .map((g) => {

                const isHome = isHomeEvent(g);

                return (

                  <div
                    key={g.id}
                    className="
                      bg-white
                      rounded-2xl
                      px-2
                      py-3
                      shadow-sm
                    "
                  >

                    <div
                      className="
                        grid
                        grid-cols-[1fr_55px_1fr]
                        items-center
                        gap-1
                      "
                    >

                      {/* ========================= */}
                      {/* HOME */}
                      {/* ========================= */}

                      <div>

                        {isHome && (

                          <Link
                            to={`/competitions/${competitionId}/clubs/${g.club_id}/players/${g.player_id}`}
                            className="
                              flex
                              items-center
                              gap-2
                              hover:opacity-80
                            "
                          >

                            {/* PHOTO */}
                            <img
                              src={g.player_photo || "/default.png"}
                              alt={g.player_name}
                              className="
                                w-10
                                h-10
                                rounded-full
                                object-cover
                                flex-shrink-0
                              "
                            />

                            {/* TEXT */}
                            <div className="min-w-0">

                              {/* PLAYER */}
                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  flex
                                  items-center
                                  gap-[2px]
                                  leading-tight
                                "
                              >

                                <span className="break-words">
                                  {abbreviateName(g.player_name)}
                                </span>

                                <span>⚽</span>

                              </p>

                              {/* ASSIST */}
                              {g.assist_name && (

                                <p
                                  className="
                                    text-xs
                                    text-gray-500
                                    flex
                                    items-center
                                    gap-[2px]
                                    mt-1
                                  "
                                >

                                  <span>
                                    {abbreviateName(g.assist_name)}
                                  </span>

                                  <img
                                    src={bootImg}
                                    alt="boot"
                                    className="w-4 h-4 object-contain"
                                  />

                                </p>

                              )}

                              {/* GOAL TYPE */}
                              {g.goal_type !== "normal" && (

                                <p
                                  className="
                                    text-xs
                                    text-orange-600
                                    font-semibold
                                    mt-1
                                  "
                                >
                                  {g.goal_type_label}
                                </p>

                              )}

                            </div>

                          </Link>

                        )}

                      </div>

                      {/* ========================= */}
                      {/* MINUTE */}
                      {/* ========================= */}

                      <div
                        className="
                          text-center
                          text-green-600
                          font-semibold
                          text-xl
                        "
                      >
                        {g.minute}'
                      </div>

                      {/* ========================= */}
                      {/* AWAY */}
                      {/* ========================= */}

                      <div>

                        {!isHome && (

                          <Link
                            to={`/competitions/${competitionId}/clubs/${g.club_id}/players/${g.player_id}`}
                            className="
                              flex
                              items-center
                              justify-end
                              gap-2
                              hover:opacity-80
                            "
                          >

                            {/* TEXT */}
                            <div className="text-right min-w-0">

                              {/* PLAYER */}
                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  flex
                                  items-center
                                  justify-end
                                  gap-[2px]
                                  leading-tight
                                "
                              >

                                <span className="break-words">
                                  {abbreviateName(g.player_name)}
                                </span>

                                <span>⚽</span>

                              </p>

                              {/* ASSIST */}
                              {g.assist_name && (

                                <p
                                  className="
                                    text-xs
                                    text-gray-500
                                    flex
                                    items-center
                                    justify-end
                                    gap-[2px]
                                    mt-1
                                  "
                                >

                                  <span>
                                    {abbreviateName(g.assist_name)}
                                  </span>

                                  <img
                                    src={bootImg}
                                    alt="boot"
                                    className="w-4 h-4 object-contain"
                                  />

                                </p>

                              )}

                              {/* GOAL TYPE */}
                              {g.goal_type !== "normal" && (

                                <p
                                  className="
                                    text-xs
                                    text-orange-600
                                    font-semibold
                                    mt-1
                                  "
                                >
                                  {g.goal_type_label}
                                </p>

                              )}

                            </div>

                            {/* PHOTO */}
                            <img
                              src={g.player_photo || "/default.png"}
                              alt={g.player_name}
                              className="
                                w-10
                                h-10
                                rounded-full
                                object-cover
                                flex-shrink-0
                              "
                            />

                          </Link>

                        )}

                      </div>

                    </div>

                  </div>

                );
              })}

          </div>

        </div>

        {/* ========================= */}
        {/* CARTONS */}
        {/* ========================= */}

        <div>

          <h2 className="text-center text-2xl font-bold text-gray-700 mb-5">
            CARTONS
          </h2>

          <div className="space-y-3">

            {[...match.cards]
              .sort((a, b) => a.minute - b.minute)
              .map((c) => {

                const isHome = isHomeEvent(c);

                const cardIcon =
                  c.color === "red" ? "🟥" : "🟨";

                return (

                  <div
                    key={c.id}
                    className="
                      bg-white
                      rounded-2xl
                      px-2
                      py-3
                      shadow-sm
                    "
                  >

                    <div
                      className="
                        grid
                        grid-cols-[1fr_55px_1fr]
                        items-center
                        gap-1
                      "
                    >

                      {/* HOME */}
                      <div>

                        {isHome && (

                          <Link
                            to={`/competitions/${competitionId}/clubs/${c.club_id}/players/${c.player_id}`}
                            className="
                              flex
                              items-center
                              gap-2
                              hover:opacity-80
                            "
                          >

                            {/* PHOTO */}
                            <img
                              src={c.player_photo || "/default.png"}
                              alt={c.player_name}
                              className="
                                w-10
                                h-10
                                rounded-full
                                object-cover
                                flex-shrink-0
                              "
                            />

                            {/* TEXT */}
                            <div className="min-w-0">

                              {/* PLAYER */}
                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  flex
                                  items-center
                                  gap-[2px]
                                  leading-tight
                                "
                              >

                                <span className="break-words">
                                  {abbreviateName(c.player_name)}
                                </span>

                                <span>{cardIcon}</span>

                              </p>

                              {/* REASON */}
                              <p
                                className="
                                  text-xs
                                  text-gray-500
                                  flex
                                  items-center
                                  gap-[2px]
                                  mt-1
                                "
                              >

                                <span>
                                  {c.reason_label}
                                </span>

                                <img
                                  src={whistleImg}
                                  alt="whistle"
                                  className="w-4 h-4 object-contain"
                                />

                              </p>

                            </div>

                          </Link>

                        )}

                      </div>

                      {/* MINUTE */}
                      <div
                        className="
                          text-center
                          text-green-600
                          font-bold
                          text-xl
                        "
                      >
                        {c.minute}'
                      </div>

                      {/* AWAY */}
                      <div>

                        {!isHome && (

                          <Link
                            to={`/competitions/${competitionId}/clubs/${c.club_id}/players/${c.player_id}`}
                            className="
                              flex
                              items-center
                              justify-end
                              gap-2
                              hover:opacity-80
                            "
                          >

                            {/* TEXT */}
                            <div className="text-right min-w-0">

                              {/* PLAYER */}
                              <p
                                className="
                                  text-sm
                                  font-semibold
                                  flex
                                  items-center
                                  justify-end
                                  gap-[2px]
                                  leading-tight
                                "
                              >

                                <span className="break-words">
                                  {abbreviateName(c.player_name)}
                                </span>

                                <span>{cardIcon}</span>

                              </p>

                              {/* REASON */}
                              <p
                                className="
                                  text-xs
                                  text-gray-500
                                  flex
                                  items-center
                                  justify-end
                                  gap-[2px]
                                  mt-1
                                "
                              >

                                <span>
                                  {c.reason_label}
                                </span>

                                <img
                                  src={whistleImg}
                                  alt="whistle"
                                  className="w-4 h-4 object-contain"
                                />

                              </p>

                            </div>

                            {/* PHOTO */}
                            <img
                              src={c.player_photo || "/default.png"}
                              alt={c.player_name}
                              className="
                                w-10
                                h-10
                                rounded-full
                                object-cover
                                flex-shrink-0
                              "
                            />

                          </Link>

                        )}

                      </div>

                    </div>

                  </div>

                );
              })}

          </div>

        </div>

      </div>

    </div>

  );
}