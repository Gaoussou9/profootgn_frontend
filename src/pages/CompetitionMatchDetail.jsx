import { useEffect, useState } from "react";
import {
  useParams,
  Link,
  useNavigate
} from "react-router-dom";

import whistleImg from "../assets/whistle.webp";
import bootImg from "../assets/crampon.png";
import { useSwipeable } from "react-swipeable";
import CompetitionMatchLineups from "./CompetitionMatchLineups";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export default function CompetitionMatchDetail() {

  const { competitionId, matchId } = useParams();
  const navigate = useNavigate();

  const [match, setMatch] = useState(null);
  const [tab, setTab] = useState("events");

  const handlers = useSwipeable({

  onSwipedLeft: () => {

    if (tab === "events") {
      setTab("lineups");
    }

  },

  onSwipedRight: () => {

    if (tab === "lineups") {
      setTab("events");
    }

  },

  trackMouse: true,
});

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

    <div
  {...handlers}
  className="max-w-md mx-auto bg-gray-100 min-h-screen pb-24"
>

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
{/* TABS */}
{/* ========================= */}

<div
  className="
    bg-white
    border-b
    sticky
    top-0
    z-20
  "
>

  <div
    className="
      flex
      items-center
      justify-center
    "
  >

    {/* EVENTS */}
    <button
      onClick={() => setTab("events")}
      className={`
        flex-1
        py-3
        text-sm
        font-bold
        transition
        border-b-2
        ${
          tab === "events"
            ? "border-green-600 text-green-600"
            : "border-transparent text-gray-500"
        }
      `}
    >
      Evènements
    </button>

    {/* COMPOSITION */}
    <button
      onClick={() => setTab("lineups")}
      className={`
        flex-1
        py-3
        text-sm
        font-bold
        transition
        border-b-2
        ${
          tab === "lineups"
            ? "border-green-600 text-green-600"
            : "border-transparent text-gray-500"
        }
      `}
    >
      Composition
    </button>

  </div>

</div>

{/* ========================= */}
{/* EVENTS */}
{/* ========================= */}

{tab === "events" && (

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
                          text-[15px]
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
                          font-semibold
                          text-[15px]
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
{/* CHANGEMENTS */}

{match.substitutions?.length > 0 && (
  <>
    <h2
      style={{
        textAlign: "center",
        marginTop: 35,
        marginBottom: 18,
        fontSize: 20,
        fontWeight: 800,
        color: "#374151",
        letterSpacing: 1,
      }}
    >
      CHANGEMENTS
    </h2>

    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {match.substitutions.map((sub) => {

        const isHome =
          sub.team === match.home_team?.id;

        return (

          <div
  key={sub.id}
  style={{
    background: "#fff",
    borderRadius: 14,
    padding: "12px 14px",
    display: "grid",
    gridTemplateColumns: "1fr 60px 1fr",
    alignItems: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,.05)",
  }}
>

  {/* DOMICILE */}
  <div>

    {isHome && (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >

        {/* SORTANT */}
<div
  onClick={() =>
    navigate(
      `/competitions/${competitionId}/clubs/${sub.player_out.club_id}/players/${sub.player_out.id}`
    )
  }
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#111827",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    width: "fit-content",
  }}
>
  {sub.player_out.photo && (
    <img
      src={sub.player_out.photo}
      alt=""
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  )}

  <span>
    {sub.player_out.name}
  </span>

  <div
    style={{
      width: 18,
      height: 18,
      borderRadius: 4,
      backgroundColor: "#dc2626",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      fontWeight: 700,
      flexShrink: 0,
    }}
  >
    ↓
  </div>
</div>

{/* ENTRANT */}
<div
  onClick={() =>
    navigate(
      `/competitions/${competitionId}/clubs/${sub.player_in.club_id}/players/${sub.player_in.id}`
    )
  }
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#111827",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    width: "fit-content",
  }}
>
  {sub.player_in.photo && (
    <img
      src={sub.player_in.photo}
      alt=""
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  )}

  <span>
    {sub.player_in.name}
  </span>

  <div
    style={{
      width: 18,
      height: 18,
      borderRadius: 4,
      backgroundColor: "#16a34a",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      fontWeight: 700,
      flexShrink: 0,
    }}
  >
    ↑
  </div>
</div>

</div>
)}

</div>

  {/* MINUTE CENTRÉE */}
  <div
    style={{
      textAlign: "center",
      fontSize: 14,
      fontWeight: 600,
      color: "#111827",
    }}
  >
    {sub.minute}'
  </div>

  {/* EXTÉRIEUR */}
  <div>

  {!isHome && (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        alignItems: "flex-end",
      }}
    >

      {/* SORTANT */}
<div
  onClick={() =>
    navigate(
      `/competitions/${competitionId}/clubs/${sub.player_out.club_id}/players/${sub.player_out.id}`
    )
  }
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#111827",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    width: "fit-content",
  }}
>
  <div
    style={{
      width: 18,
      height: 18,
      borderRadius: 4,
      backgroundColor: "#dc2626",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      fontWeight: 700,
      flexShrink: 0,
    }}
  >
    ↓
  </div>

  {sub.player_out.photo && (
    <img
      src={sub.player_out.photo}
      alt=""
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  )}

  <span>
    {sub.player_out.name}
  </span>
</div>

{/* ENTRANT */}
<div
  onClick={() =>
    navigate(
      `/competitions/${competitionId}/clubs/${sub.player_in.club_id}/players/${sub.player_in.id}`
    )
  }
  style={{
    display: "flex",
    alignItems: "center",
    gap: 6,
    color: "#111827",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
    width: "fit-content",
  }}
>
  <div
    style={{
      width: 18,
      height: 18,
      borderRadius: 4,
      backgroundColor: "#16a34a",
      color: "#ffffff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 11,
      fontWeight: 700,
      flexShrink: 0,
    }}
  >
    ↑
  </div>

  {sub.player_in.photo && (
    <img
      src={sub.player_in.photo}
      alt=""
      style={{
        width: 22,
        height: 22,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  )}

  <span>
    {sub.player_in.name}
  </span>
</div>

    </div>
  )}

</div>

</div>
        );

      })}
    </div>
  </>
)}
</div>

)}
{/* ========================= */}
{/* COMPOSITION */}
{/* ========================= */}

{/* ========================= */}
{/* COMPOSITION */}
{/* ========================= */}

{tab === "lineups" && (
  <CompetitionMatchLineups />
)}
</div>

  );
}