import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function ClubPage() {
  const { competitionId, clubId } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [matches, setMatches] = useState([]);
  const [players, setPlayers] = useState([]);

  const [activeTab, setActiveTab] = useState("matches");

  const [loading, setLoading] = useState(true);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [error, setError] = useState(null);

  /* ================= FETCH CLUB + STATS ================= */
  useEffect(() => {
    if (!competitionId || !clubId) return;

    setLoading(true);
    setError(null);

    fetch(`${API}/api/competitions/${competitionId}/clubs/${clubId}/`)
      .then(res => {
        if (!res.ok) throw new Error("Impossible de charger le club");
        return res.json();
      })
      .then(json => {
        setData(json);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, [competitionId, clubId]);

  /* ================= FETCH MATCHES DU CLUB ================= */
  useEffect(() => {
    if (!competitionId || !clubId) return;

    setLoadingMatches(true);

    fetch(`${API}/api/competitions/${competitionId}/clubs/${clubId}/matches/`)
      .then(res => {
        if (!res.ok) throw new Error("Impossible de charger les matchs");
        return res.json();
      })
      .then(json => {
  setMatches(Array.isArray(json) ? json : []);
  setLoadingMatches(false);
})

      .catch(err => {
        console.error(err);
        setLoadingMatches(false);
      });
  }, [competitionId, clubId]);

  /* ================= FETCH JOUEURS (EFFECTIF) ================= */
  useEffect(() => {
    if (!competitionId || !clubId) return;
    if (activeTab !== "squad") return;

    setLoadingPlayers(true);

    fetch(`${API}/api/competitions/${competitionId}/clubs/${clubId}/players/`)
      .then(res => {
        if (!res.ok) throw new Error("Impossible de charger l’effectif");
        return res.json();
      })
      .then(json => {
        setPlayers(json.players || []);
        setLoadingPlayers(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingPlayers(false);
      });
  }, [competitionId, clubId, activeTab]);

  if (loading) return <p className="p-4">Chargement du club…</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!data) return <p className="p-4">Club introuvable</p>;

  const { club, competition, stats = {} } = data;


  return (
    <div className="pb-28">

      {/* ================= HEADER CLUB ================= */}
      <div className="bg-white rounded-b-2xl shadow px-4 pt-5 pb-6">
        <div className="flex items-center gap-4">
          {club.logo ? (
            <img
              src={club.logo}
              alt={club.name}
              className="w-16 h-16 object-contain"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200" />
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{club.name}</h1>
            <p className="text-xs text-gray-500">{club.city || "—"}</p>
            <p className="text-xs text-blue-600 font-medium mt-1">
              {competition.name} • {competition.season}
            </p>
          </div>
        </div>

        {/* STATS RAPIDES */}
        <div className="flex justify-around mt-4 text-center">
          <Stat label="Pos" value={stats?.position ?? "-"} />
<Stat label="Pts" value={stats?.points ?? "-"} />
<Stat label="J" value={stats?.played ?? "-"} />
<Stat label="Diff" value={stats?.goal_difference ?? "-"} />

        </div>
      </div>

      {/* ================= ONGLET NAV ================= */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex">
          <TabButton
            label="Matchs"
            active={activeTab === "matches"}
            onClick={() => setActiveTab("matches")}
          />
          <TabButton
            label="Effectif"
            active={activeTab === "squad"}
            onClick={() => setActiveTab("squad")}
          />
          <TabButton
            label="Staff"
            active={activeTab === "staff"}
            onClick={() => setActiveTab("staff")}
          />
        </div>
      </div>

      {/* ================= CONTENU ================= */}
      <div className="p-4">

        {/* ===== MATCHS ===== */}
        {activeTab === "matches" && (
          <Section title="Matchs du club">
            {loadingMatches ? (
              <p className="text-xs text-gray-500">
                Chargement des matchs…
              </p>
            ) : matches.length === 0 ? (
              <Empty text="Aucun match disponible pour ce club." />
            ) : (
              <div className="space-y-3">
                {matches.map(match => {
                  const home = match.home_team;
                  const away = match.away_team;
                  const isPlayed = match.status !== "SCHEDULED";
                  const centerText = isPlayed
                    ? `${match.home_score} - ${match.away_score}`
                    : "vs";

                  return (
                    <button
  key={match.id}
  onClick={() =>
    navigate(
      `/competitions/${competitionId}/match/${match.id}`
    )
  }
  className="
    w-full bg-white rounded-xl shadow
    px-4 py-3 flex items-center justify-between
    active:scale-95 transition
  "
>

                      <div className="flex items-center gap-2 w-[40%]">
                        {home.logo && (
                          <img
                            src={home.logo}
                            alt={home.name}
                            className="w-7 h-7 object-contain"
                          />
                        )}
                        <span className="text-sm font-medium truncate">
                          {home.name}
                        </span>
                      </div>

                      <div className="text-sm font-bold w-[20%] text-center">
                        {centerText}
                      </div>

                      <div className="flex items-center gap-2 justify-end w-[40%]">
                        <span className="text-sm font-medium truncate text-right">
                          {away.name}
                        </span>
                        {away.logo && (
                          <img
                            src={away.logo}
                            alt={away.name}
                            className="w-7 h-7 object-contain"
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Section>
        )}

        {/* ===== EFFECTIF ===== */}
        {activeTab === "squad" && (
          <Section title="Effectif">
            {loadingPlayers ? (
              <p className="text-xs text-gray-500">
                Chargement de l’effectif…
              </p>
            ) : players.length === 0 ? (
              <Empty text="Aucun joueur enregistré pour ce club." />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {players.map(player => (
                  <div
                    key={player.id}
                    className="
                      bg-white rounded-xl shadow
                      p-3 flex flex-col items-center
                    "
                  >
                    {player.photo ? (
                      <img
                        src={player.photo}
                        alt={player.name}
                        className="w-14 h-14 rounded-full object-cover mb-2"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gray-200 mb-2" />
                    )}

                    <div className="text-sm font-medium truncate">
                      {player.name}
                    </div>
                    <div className="text-[11px] text-gray-500">
                      {player.position || "—"}
                    </div>
                    {player.number && (
                      <div className="text-xs font-bold text-blue-600 mt-1">
                        #{player.number}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>
        )}

        {/* ===== STAFF ===== */}
        {activeTab === "staff" && (
          <Section title="Staff technique">
            <Empty text="Le staff du club sera affiché ici." />
          </Section>
        )}

      </div>
    </div>
  );
}

/* ================= UI COMPONENTS ================= */

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium ${
        active
          ? "text-blue-600 border-b-2 border-blue-600"
          : "text-gray-500"
      }`}
    >
      {label}
    </button>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-sm font-semibold mb-2">{title}</h2>
      {children}
    </div>
  );
}

function Empty({ text }) {
  return (
    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
      {text}
    </p>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[11px] text-gray-500">{label}</div>
    </div>
  );
}
