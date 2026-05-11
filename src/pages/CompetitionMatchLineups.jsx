import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import FootballPitch from "../components/lineups/FootballPitch";

export default function CompetitionMatchLineups() {

  const navigate = useNavigate();

  const {
    competitionId,
    matchId
  } = useParams();

  const [data, setData] = useState(null);

  const API =
    window.location.hostname === "localhost"
      ? "http://127.0.0.1:8000"
      : "https://api.kanousport.com";

  useEffect(() => {

    fetch(
      `${API}/api/competitions/${competitionId}/matches/${matchId}/lineups/`
    )
      .then((res) => {

        if (!res.ok) {
          throw new Error("Erreur API");
        }

        return res.json();
      })

      .then((data) => {
        setData(data);
      })

      .catch((err) => {
        console.error(err);
      });

  }, [competitionId, matchId]);

  if (!data) {

    return (
      <div
        style={{
          padding: 20,
          textAlign: "center",
          color: "#6b7280",
          fontWeight: 600,
        }}
      >
        Chargement...
      </div>
    );
  }

  // =========================
  // PLAYER CARD HOME
  // =========================

  const HomePlayerCard = ({ p }) => (

    <div
      onClick={() =>
        navigate(
          `/competitions/${competitionId}/clubs/${p.club_id}/players/${p.id}`
        )
      }
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#f9fafb",
        padding: 10,
        borderRadius: 14,
        cursor: "pointer",
        border: "1px solid #f1f5f9",
      }}
    >

      {/* PHOTO */}
      {p.photo && (
        <img
          src={p.photo}
          alt=""
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      )}

      {/* INFOS */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >

        {/* NOM */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontWeight: 700,
            fontSize: 14,
            color: "#111827",
          }}
        >

          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {p.name}
          </span>

          {p.is_player_of_match && (
            <span>⭐</span>
          )}

        </div>

        {/* POSITION */}
        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
            marginTop: 2,
          }}
        >
          {p.position || "—"}
        </div>

      </div>

      {/* NOTE */}
      <div
        style={{
          textAlign: "right",
        }}
      >

        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#16a34a",
          }}
        >
          {p.rating || "0.0"}
        </div>

        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#9ca3af",
          }}
        >
          #{p.number || 0}
        </div>

      </div>

    </div>
  );

  // =========================
  // PLAYER CARD AWAY
  // =========================

  const AwayPlayerCard = ({ p }) => (

    <div
      onClick={() =>
        navigate(
          `/competitions/${competitionId}/clubs/${p.club_id}/players/${p.id}`
        )
      }
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 10,
        background: "#f9fafb",
        padding: 10,
        borderRadius: 14,
        cursor: "pointer",
        border: "1px solid #f1f5f9",
      }}
    >

      {/* NOTE */}
      <div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 800,
            color: "#16a34a",
            textAlign: "left",
          }}
        >
          {p.rating || "0.0"}
        </div>

        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#9ca3af",
          }}
        >
          #{p.number || 0}
        </div>

      </div>

      {/* INFOS */}
      <div
        style={{
          flex: 1,
          textAlign: "right",
          minWidth: 0,
        }}
      >

        {/* NOM */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 5,
            fontWeight: 700,
            fontSize: 14,
            color: "#111827",
          }}
        >

          {p.is_player_of_match && (
            <span>⭐</span>
          )}

          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {p.name}
          </span>

        </div>

        {/* POSITION */}
        <div
          style={{
            fontSize: 12,
            color: "#6b7280",
            marginTop: 2,
          }}
        >
          {p.position || "—"}
        </div>

      </div>

      {/* PHOTO */}
      {p.photo && (
        <img
          src={p.photo}
          alt=""
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
      )}

    </div>
  );

  return (

    <div
      style={{
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        paddingBottom: 100,
      }}
    >

      {/* HEADER */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: 18,
          boxShadow: "0 2px 10px rgba(0,0,0,.05)",
          textAlign: "center",
        }}
      >

        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 800,
            color: "#1e293b",
          }}
        >
          📋 Compositions
        </h1>

        <div
          style={{
            marginTop: 6,
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          Titulaires officiels
        </div>

      </div>

      {/* DOMICILE */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: 16,
          boxShadow: "0 2px 10px rgba(0,0,0,.05)",
        }}
      >

        {/* TITRE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
          }}
        >

          <div
            style={{
              background: "#dcfce7",
              color: "#166534",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            DOMICILE
          </div>

          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            {data.home_team.name}
          </h2>

        </div>

        {/* JOUEURS */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >

  <FootballPitch
  players={data.home_starters}
  formation={data.home_formation}
  competitionId={competitionId}
/>

        </div>

      </div>

      {/* EXTÉRIEUR */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: 20,
          padding: 16,
          boxShadow: "0 2px 10px rgba(0,0,0,.05)",
        }}
      >

        {/* TITRE */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 10,
            marginBottom: 16,
          }}
        >

          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 800,
              color: "#0f172a",
            }}
          >
            {data.away_team.name}
          </h2>

          <div
            style={{
              background: "#dbeafe",
              color: "#1d4ed8",
              padding: "4px 10px",
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            EXTÉRIEUR
          </div>

        </div>

        {/* JOUEURS */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >

  <FootballPitch
  players={data.away_starters}
  formation={data.away_formation}
  competitionId={competitionId}
/>

        </div>

      </div>

    </div>

  );
}