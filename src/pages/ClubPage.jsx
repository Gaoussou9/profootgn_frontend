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

  /* ================= FETCH CLUB ================= */
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
        setError(err.message);
        setLoading(false);
      });
  }, [competitionId, clubId]);

  /* ================= FETCH MATCHES ================= */
  useEffect(() => {
    if (!competitionId || !clubId) return;

    setLoadingMatches(true);

    fetch(`${API}/api/competitions/${competitionId}/clubs/${clubId}/matches/`)
      .then(res => res.json())
      .then(json => {
        setMatches(Array.isArray(json) ? json : []);
        setLoadingMatches(false);
      })
      .catch(() => setLoadingMatches(false));
  }, [competitionId, clubId]);

  /* ================= FETCH PLAYERS ================= */
  useEffect(() => {
    if (!competitionId || !clubId) return;
    if (activeTab !== "squad") return;

    setLoadingPlayers(true);

    fetch(`${API}/api/competitions/${competitionId}/clubs/${clubId}/players/`)
      .then(res => res.json())
      .then(json => {
        setPlayers(json.players || []);
        setLoadingPlayers(false);
      })
      .catch(() => setLoadingPlayers(false));
  }, [competitionId, clubId, activeTab]);

  if (loading) return <p className="p-4">Chargement du club…</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;
  if (!data) return <p className="p-4">Club introuvable</p>;

  const { club, competition, stats = {} } = data;

  /* ================= REGROUPEMENT PAR POSTE ================= */

  const groupByPosition = (type) => {
    return players.filter(p => {
      const pos = (p.position || "").toUpperCase();
      if (type === "GK") return pos.includes("GK") || pos.includes("GARD");
      if (type === "DEF") return pos.includes("DEF");
      if (type === "MID") return pos.includes("MID");
      if (type === "ATT") return pos.includes("ATT");
      return false;
    });
  };

  const sections = [
    { key: "GK", label: "GARDIENS" },
    { key: "DEF", label: "DÉFENSEURS" },
    { key: "MID", label: "MILIEUX" },
    { key: "ATT", label: "ATTAQUANTS" },
  ];

  return (
    <div className="pb-28">

      {/* ================= HEADER ================= */}
      <div className="bg-white rounded-b-2xl shadow px-4 pt-5 pb-6">
        <div className="flex items-center gap-4">
          {club.logo ? (
            <img src={club.logo} alt={club.name} className="w-16 h-16 object-contain" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-200" />
          )}

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{club.name}</h1>
            <p className="text-xs text-gray-500">{club.city || "—"}</p>
            <p className="text-xs text-red-600 font-medium mt-1">
              {competition.name} • {competition.season}
            </p>
          </div>
        </div>

        <div className="flex justify-around mt-4 text-center">
          <Stat label="Pos" value={stats?.position ?? "-"} />
          <Stat label="Pts" value={stats?.points ?? "-"} />
          <Stat label="J" value={stats?.played ?? "-"} />
          <Stat label="Diff" value={stats?.goal_difference ?? "-"} />
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="sticky top-0 z-10 bg-white border-b">
        <div className="flex">
          <TabButton label="Matchs" active={activeTab === "matches"} onClick={() => setActiveTab("matches")} />
          <TabButton label="Effectif" active={activeTab === "squad"} onClick={() => setActiveTab("squad")} />
          <TabButton label="Staff" active={activeTab === "staff"} onClick={() => setActiveTab("staff")} />
        </div>
      </div>

      <div className="p-4">

        {/* ================= MATCHES ================= */}
        {activeTab === "matches" && (
          <>
            {loadingMatches ? (
              <p className="text-xs text-gray-500">Chargement des matchs…</p>
            ) : matches.length === 0 ? (
              <p className="text-xs text-gray-500">Aucun match disponible.</p>
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
                        navigate(`/competitions/${competitionId}/match/${match.id}`)
                      }
                      className="w-full bg-white rounded-xl shadow px-4 py-3 flex items-center justify-between active:scale-95 transition"
                    >
                      <div className="flex items-center gap-2 w-[40%]">
                        {home.logo && (
                          <img src={home.logo} alt={home.name} className="w-7 h-7 object-contain" />
                        )}
                        <span className="text-sm font-medium truncate">{home.name}</span>
                      </div>

                      <div className="text-sm font-bold w-[20%] text-center">
                        {centerText}
                      </div>

                      <div className="flex items-center gap-2 justify-end w-[40%]">
                        <span className="text-sm font-medium truncate text-right">{away.name}</span>
                        {away.logo && (
                          <img src={away.logo} alt={away.name} className="w-7 h-7 object-contain" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ================= EFFECTIF PREMIUM ================= */}
        {activeTab === "squad" && (
          <>
            {loadingPlayers ? (
              <p className="text-xs text-gray-500">Chargement…</p>
            ) : (
              <div className="bg-white rounded-2xl shadow overflow-hidden">

                {sections.map(section => {
                  const playersInSection = groupByPosition(section.key);
                  if (playersInSection.length === 0) return null;

                  return (
                    <div key={section.key}>

                      <div className="bg-emerald-700 text-white px-4 py-2 text-xs font-bold flex justify-between">
                        <span>{section.label}</span>
                        <div className="flex gap-6 text-[11px] font-semibold">
                          <span>PJ</span>
                          <span>⚽</span>
                          <img
  src="/icons/cleat_20.png"
  alt="Assist"
  className="w-4 h-4 object-contain"
/>
                          <span>🟨</span>
                          <span>🟥</span>
                        </div>
                      </div>

                      {playersInSection.map(player => (
                        <button
                          key={player.id}
                          onClick={() =>
                            navigate(`/competitions/${competitionId}/clubs/${clubId}/players/${player.id}`)
                          }
                          className="w-full flex items-center px-4 py-3 border-b hover:bg-gray-50 transition"
                        >

                          <div className="w-8 text-center font-bold text-gray-500 text-sm">
                            {player.number || "-"}
                          </div>

                          <div className="mx-3">
                            {player.photo ? (
                              <img
                                src={player.photo}
                                alt={player.name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200" />
                            )}
                          </div>

                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2 font-semibold text-sm">
                              {player.name}

                              {(player.nationality_flag || player.country_code) && (
                                <img
                                  src={
                                    player.nationality_flag
                                      ? player.nationality_flag
                                      : `https://flagcdn.com/w20/${(player.country_code || "").toLowerCase()}.png`
                                  }
                                  alt=""
                                  className="w-5 h-5 rounded-full object-cover border"
                                />
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-xs font-semibold text-gray-700 min-w-[160px] justify-end">
                            <span>{Number(player.played) || 0}</span>
                            <span>{Number(player.goals) || 0}</span>
                            <span>{Number(player.assists) || 0}</span>
                            <span>{Number(player.yellow_cards) || 0}</span>
                            <span>{Number(player.red_cards) || 0}</span>
                          </div>

                        </button>
                      ))}

                    </div>
                  );
                })}

              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}

/* ================= UI ================= */

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 py-3 text-sm font-medium ${
        active
          ? "text-red-600 border-b-2 border-red-600"
          : "text-gray-500"
      }`}
    >
      {label}
    </button>
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