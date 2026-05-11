import { useNavigate } from "react-router-dom";

export default function FootballPitch({
  players = [],
  competitionId,
}) {

  const navigate = useNavigate();

  const positionOrder = {

  GK: 1,

  LB: 2,
  LWB: 2,

  CB: 3,

  RB: 4,
  RWB: 4,

  DM: 5,

  CM: 6,

  AM: 7,

  LW: 8,

  RW: 9,

  ST: 10,
};

const sortedPlayers = [...players].sort(
  (a, b) => {

    const aOrder =
      positionOrder[a.position] || 99;

    const bOrder =
      positionOrder[b.position] || 99;

    return aOrder - bOrder;
  }
);

  // =========================
  // COORDONNÉES PAR POSTE
  // =========================

  const positionCoordinates = {

    // GARDIEN
    GK: [50, 88],

    // DÉFENSE
    LB: [15, 72],
    LWB: [8, 68],

    CB: [50, 72],

    RB: [85, 72],
    RWB: [92, 68],

    // MILIEU
    DM: [50, 58],

    CM: [50, 48],

    AM: [50, 34],

    // ATTAQUE
    LW: [20, 18],

    RW: [80, 18],

    ST: [50, 10],
  };

  return (

    <div
      style={{
        position: "relative",
        width: "100%",
        height: 700,
        borderRadius: 24,
        overflow: "hidden",
        background:
          "linear-gradient(to bottom, #15803d 0%, #166534 100%)",
        boxShadow: "0 4px 16px rgba(0,0,0,.12)",
      }}
    >

      {/* ========================= */}
      {/* TERRAIN */}
      {/* ========================= */}

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.18,
        }}
      >

        {/* CONTOUR */}
        <div
          style={{
            position: "absolute",
            inset: 12,
            border: "2px solid white",
            borderRadius: 8,
          }}
        />

        {/* LIGNE CENTRALE */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: 12,
            right: 12,
            height: 2,
            background: "#ffffff",
          }}
        />

        {/* CERCLE CENTRAL */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: 110,
            height: 110,
            borderRadius: "50%",
            border: "2px solid white",
            transform: "translate(-50%, -50%)",
          }}
        />

        {/* SURFACE HAUTE */}
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            width: 180,
            height: 90,
            border: "2px solid white",
            transform: "translateX(-50%)",
          }}
        />

        {/* SURFACE BASSE */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: "50%",
            width: 180,
            height: 90,
            border: "2px solid white",
            transform: "translateX(-50%)",
          }}
        />

      </div>

      {/* ========================= */}
      {/* JOUEURS */}
      {/* ========================= */}

      {sortedPlayers.map((p) => {

        // coordonnées selon poste
        const coords =
          positionCoordinates[p.position];

        const autoX =
          coords?.[0] || 50;

        const autoY =
          coords?.[1] || 50;

        // fallback backend
        const finalX =
          Number(p.x) > 0
            ? Number(p.x)
            : autoX;

        const finalY =
          Number(p.y) > 0
            ? Number(p.y)
            : autoY;

        return (

          <div
            key={p.id}
            onClick={() =>
              navigate(
                `/competitions/${competitionId}/clubs/${p.club_id}/players/${p.id}`
              )
            }
            style={{
              position: "absolute",

              left: `${finalX}%`,
              top: `${finalY}%`,

              transform: "translate(-50%, -50%)",

              display: "flex",
              flexDirection: "column",
              alignItems: "center",

              width: 72,

              cursor: "pointer",
              zIndex: 5,
            }}
          >

            {/* NOTE */}
            {p.rating > 0 && (

              <div
                style={{
                  position: "absolute",
                  top: -10,
                  right: 8,

                  background: "#16a34a",
                  color: "#ffffff",

                  fontSize: 11,
                  fontWeight: 800,

                  padding: "2px 6px",

                  borderRadius: 999,
                  border: "2px solid white",
                }}
              >
                {p.rating}
              </div>

            )}

            {/* PHOTO */}
            <div
              style={{
                position: "relative",
              }}
            >

              <img
                src={p.photo}
                alt={p.name}
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  objectFit: "cover",

                  border: p.is_player_of_match
                    ? "3px solid gold"
                    : "3px solid white",

                  boxShadow:
                    "0 3px 10px rgba(0,0,0,.25)",
                }}
              />

              {/* CAPITAINE */}
              {p.is_captain && (

                <div
                  style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,

                    width: 18,
                    height: 18,

                    borderRadius: "50%",

                    background: "#1d4ed8",
                    color: "#ffffff",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    fontSize: 10,
                    fontWeight: 800,

                    border: "2px solid white",
                  }}
                >
                  C
                </div>

              )}

            </div>

            {/* NOM */}
            <div
              style={{
                marginTop: 6,

                background: "rgba(0,0,0,.55)",

                color: "#ffffff",

                padding: "4px 8px",

                borderRadius: 999,

                fontSize: 11,
                fontWeight: 700,

                maxWidth: 72,

                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",

                textAlign: "center",
              }}
            >
              {p.name}
            </div>

            {/* POSTE */}
            <div
              style={{
                marginTop: 3,

                fontSize: 10,
                fontWeight: 700,

                color: "#dcfce7",
              }}
            >
              {p.position}
            </div>

          </div>

        );

      })}

    </div>

  );
}