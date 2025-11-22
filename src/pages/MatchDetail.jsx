// src/pages/MatchDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import { usePlayerSheet } from "../components/PlayerSheet";

/* ------------ Icône assist (crampon) ------------ */
const ASSIST_ICON_SRC = "/icons/cleat_20.png";
const AssistIconImg = ({ size = 16 }) => (
  <img
    src={ASSIST_ICON_SRC}
    alt="Assist"
    width={size}
    height={size}
    className="inline-block object-contain align-middle shrink-0"
    onError={(e) => {
      e.currentTarget.outerHTML = "A";
    }}
  />
);
/* ------------------------------------------------ */

const Logo = ({ src, alt, size = "w-12 h-12" }) => (
  <img
    src={src || "/club-placeholder.png"}
    alt={alt}
    className={`${size} object-contain`}
    onError={(e) => (e.currentTarget.src = "/club-placeholder.png")}
  />
);

const TinyAvatar = ({ src, alt, size = 32, onClick }) => (
  <img
    src={src || "/player-placeholder.png"}
    alt={alt || "Joueur"}
    width={size}
    height={size}
    className={`rounded-full object-cover ring-1 ring-gray-200 shrink-0 ${
      onClick ? "cursor-pointer" : ""
    }`}
    onError={(e) => (e.currentTarget.src = "/player-placeholder.png")}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={
      onClick
        ? (e) => {
            if (e.key === "Enter" || e.key === " ") onClick();
          }
        : undefined
    }
    title={onClick ? `Voir la fiche de ${alt || "ce joueur"}` : alt}
  />
);

const BallIcon = ({ size = 18 }) => (
  <span
    className="inline-flex items-center justify-center leading-none select-none shrink-0"
    style={{ width: size, height: size }}
    aria-hidden
  >
    ⚽
  </span>
);

const playerPhoto = (ev = {}) => {
  const p = ev.player || {};
  return p.photo || ev.player_photo || ev.photo || ev.playerPhoto || null;
};

const getEventPlayerId = (ev = {}) => {
  if (ev.player_id != null) return ev.player_id;
  if (typeof ev.player === "number") return ev.player;
  if (ev.player && typeof ev.player.id === "number") return ev.player.id;
  if (typeof ev.scorer_id === "number") return ev.scorer_id;
  if (ev.scorer && typeof ev.scorer.id === "number") return ev.scorer.id;
  return null;
};

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : "");

/* ---------- helpers noms & note ---------- */
const displayName = (p = {}) =>
  p.player_display ||
  p.player_name ||
  p.name ||
  [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
  (p.player &&
    [p.player.first_name, p.player.last_name].filter(Boolean).join(" ").trim()) ||
  "";

const toShort = (fullName) => {
  const s = String(fullName || "").trim();
  if (!s) return "";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];
  const initial = parts[0][0]?.toUpperCase() || "";
  const last = parts[parts.length - 1];
  return `${initial}. ${last}`;
};

const getRating = (p = {}) => {
  let v =
    p.rating ??
    p.note ??
    p.score ??
    p.player?.rating ??
    p.player?.note ??
    p.player?.score ??
    null;
  if (typeof v === "string") v = v.replace(",", ".").trim();
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const getClubId = (p) => {
  if (p == null) return null;
  if (typeof p.club === "number") return p.club;
  if (typeof p.club_id === "number") return p.club_id;
  if (typeof p.club === "string" && /^\d+$/.test(p.club)) return Number(p.club);
  if (typeof p.club_id === "string" && /^\d+$/.test(p.club_id))
    return Number(p.club_id);
  if (p.club && typeof p.club.id === "number") return p.club.id;
  return null;
};
// Robust club equality to avoid mixing home/away on type mismatch
const clubEq = (p, id) => {
  try {
    const a = Number(getClubId(p));
    const b = Number(id);
    if (Number.isNaN(a) || Number.isNaN(b)) return String(getClubId(p)) === String(id);
    return a === b;
  } catch {
    return String(getClubId(p)) === String(id);
  }
};
const isStarting = (p) => {
  const v = p.is_starting ?? p.starter ?? p.starting ?? null;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string")
    return ["1", "true", "yes", "y"].includes(v.toLowerCase());
  return !!v;
};

/* ---------- événements -> stats ---------- */
const normName = (s) =>
  String(s || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

const bestNameFor = (p) =>
  displayName(p) ||
  p.player_name ||
  [p.first_name, p.last_name].filter(Boolean).join(" ").trim();

function buildEventStats(m) {
  const stats = {};
  const bump = (name, field) => {
    if (!name) return;
    const k = normName(name);
    if (!stats[k]) stats[k] = { goals: 0, assists: 0, yellow: 0, red: 0 };
    stats[k][field] += 1;
  };

  (m.goals || []).forEach((g) => {
    bump(
      g.player_name || g.player?.name || bestNameFor(g.player || {}),
      "goals"
    );
    const a =
      g.assist_name ||
      g.assist_player_name ||
      (g.assist &&
        (g.assist.name ||
          `${g.assist.first_name || ""} ${g.assist.last_name || ""}`.trim()));
    if (a) bump(a, "assists");
  });

  (m.cards || []).forEach((c) => {
    const nm = c.player_name || c.player?.name || bestNameFor(c.player || {});
    const typ = (c.color ?? c.type ?? "").toString().toUpperCase();
    if (typ === "R" || typ.includes("RED")) bump(nm, "red");
    else bump(nm, "yellow");
  });

  return stats;
}

/* ===================== COMPOS – PlayerChip ===================== */
const PlayerChip = ({
  id,
  clubId,
  name,
  number,
  photo,
  isCaptain = false,
  note = null,
  isMotm = false,
  ev = { goals: 0, assists: 0, yellow: 0, red: 0 },
  raw,
  scale = 1,
}) => {
  const { openSheet, openSheetSmart } = usePlayerSheet();
  const label = (name && String(name).trim()) || "";
  const showNote =
    Number.isFinite(Number(note)) && Number(note) > 0 ? Number(note) : null;

  const ratingClass =
    showNote == null
      ? ""
      : showNote < 5
      ? "bg-red-100 text-red-700"
      : showNote < 7.5
      ? "bg-blue-100 text-blue-700"
      : "bg-green-100 text-green-700";

  const hasCards = (ev.yellow || 0) > 0 || (ev.red || 0) > 0;

  const guessedId =
    id ??
    raw?.player_id ??
    (typeof raw?.player === "number" ? raw.player : raw?.player?.id) ??
    (typeof raw?.id === "number" && raw?.id_is_player ? raw.id : null);

  const onClick = () => {
    if (guessedId) return openSheet(guessedId);
    const nm = label || bestNameFor(raw || {});
    const cId = clubId ?? getClubId(raw || {});
    openSheetSmart({ name: nm, clubId: cId });
  };

  return (
    <div
      className="flex flex-col items-center select-none"
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      <div className="relative w-16 h-16 rounded-full ring-2 ring-white shadow">
        <img
          src={photo || "/player-placeholder.png"}
          alt={label || "Joueur"}
          className="w-16 h-16 rounded-full object-cover cursor-pointer"
          onError={(e) => {
            e.currentTarget.src = "/player-placeholder.png";
          }}
          onClick={onClick}
        />

        {isMotm && (
          <span className="absolute -top-4 -left-4 text-yellow-400 text-4xl drop-shadow">
            ★
          </span>
        )}

        {showNote != null && (
          <span
            className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold rounded px-1 ${ratingClass}`}
          >
            {showNote.toFixed(1)}
          </span>
        )}

        {(ev.goals > 0 || ev.assists > 0) && (
          <div className="absolute -top-1 -right-3 flex flex-col items-center gap-0.5">
            {ev.goals > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/80 rounded px-1 ring-1 ring-gray-200">
                <BallIcon size={16} />
                {ev.goals > 1 ? ev.goals : ""}
              </span>
            )}
            {ev.assists > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/80 rounded px-1 ring-1 ring-gray-200">
                <AssistIconImg size={16} />
                {ev.assists > 1 ? ev.assists : ""}
              </span>
            )}
          </div>
        )}

        {hasCards && (
          <div className="absolute top-1/2 left-0 flex flex-col gap-0.5">
            {Array.from({ length: ev.yellow || 0 }).map((_, i) => (
              <span
                key={`y-${i}`}
                className="w-4 h-5 bg-yellow-300 border border-yellow-600 rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.05)]"
              />
            ))}
            {Array.from({ length: ev.red || 0 }).map((_, i) => (
              <span
                key={`r-${i}`}
                className="w-4 h-5 bg-red-500 border border-red-700 rounded-sm shadow-[0_0_0_1px_rgba(0,0,0,0.05)]"
              />
            ))}
          </div>
        )}

        {isCaptain && (
          <span className="absolute -bottom-1 -right-1 text-[11px] font-bold bg-sky-600 text-white rounded px-1">
            C
          </span>
        )}

        {Number.isFinite(Number(number)) && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[11px] font-bold bg-black/75 text-white rounded px-1">
            {number}
          </span>
        )}
      </div>

      <div className="mt-1 max-w-[120px] px-2 py-0.5 rounded-full bg-black text-white text-[11px] leading-tight truncate">
        {label}
      </div>
    </div>
  );
};

/* ===== Helpers formation & terrain ===== */
const parseFormation = (formationStr, starters) => {
  if (typeof formationStr === "string" && /^\d+(-\d+)+$/.test(formationStr)) {
    return formationStr.split("-").map((n) => Number(n));
  }
  const count = (prefix) =>
    starters.filter((p) => (p.position || "").toUpperCase().startsWith(prefix))
      .length;
  const d = count("D") || 4;
  const m = count("M") || 3;
  const f = count("F") || count("A") || 3;
  return [d, m, f];
};

/* ----- nouvelle fonction : enforce positions from order ----- */
/**
 * Si les positions sont manquantes, on applique la règle :
 * 0 => G
 * 1..4 => D (4)
 * 5..7 => M (3)
 * reste => F
 * On n'écrase QUE si position est falsy / vide.
 */
function enforcePositionsByOrder(arr) {
  if (!Array.isArray(arr)) return arr;
  return arr.map((p, idx) => {
    const pos = (p.position || "").toString().trim();
    if (pos) return p; // laisse tel quel si une position existe

    let newPos = "";
    if (idx === 0) newPos = "G";
    else if (idx >= 1 && idx <= 4) newPos = "D";
    else if (idx >= 5 && idx <= 7) newPos = "M";
    else newPos = "F"; // attaque
    return { ...p, position: newPos };
  });
}

const makeLines = (starters, formationStr) => {
  const GK = starters.filter((p) =>
    (p.position || "").toUpperCase().startsWith("G")
  );
  // tous les autres
  const field = starters.filter(
    (p) => !(p.position || "").toUpperCase().startsWith("G")
  );
  field.sort(
    (a, b) =>
      (a.number ?? 999) - (b.number ?? 999) ||
      String(displayName(a)).localeCompare(String(displayName(b)))
  );
  const counts = parseFormation(formationStr, starters);
  const lines = [];
  lines.push(field.splice(0, counts[0])); // défense
  lines.push(field.splice(0, counts[1])); // milieux
  lines.push(field.splice(0, counts[2])); // attaque
  if (field.length) lines.splice(1, 0, field); // si éléments restants, les insérer au milieu
  return { gk: GK[0] || null, rows: lines };
};

const Pitch = ({ children }) => (
  <div
    className="relative w-full rounded-2xl border bg-[linear-gradient(180deg,#1b7f3a_0%,#1a6d33_100%)]"
    style={{ aspectRatio: "16 / 18" }}
  >
    <div className="absolute inset-2 rounded-xl border-2 border-white/70 pointer-events-none" />
    <div className="absolute inset-y-2 left-1/2 w-0.5 bg-white/70 pointer-events-none" />
    <div className="absolute left-2 right-2 top-1/4 h-px bg-white/20 pointer-events-none" />
    <div className="absolute left-2 right-2 top-2/4 h-px bg-white/20 pointer-events-none" />
    <div className="absolute left-2 right-2 top-3/4 h-px bg-white/20 pointer-events-none" />
    {children}
  </div>
);

/* ===================== Carte équipe ===================== */
const TeamLineupCard = ({
  title,
  logo,
  starters,
  subs,
  formation,
  coachName,
  teamAvg,
  motmId,
  evStats,
  chipScale = 1,
}) => {
  const { gk, rows } = makeLines(starters, formation);
  const isMotm = (p) => motmId != null && p && p.id === motmId;

  const badgeAvg = Number.isFinite(Number(teamAvg)) ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
      {Number(teamAvg).toFixed(2)} moy. équipe
    </span>
  ) : null;

  const chipFor = (p) => {
    const nm = bestNameFor(p);
    const ev = evStats[normName(nm)] || {
      goals: 0,
      assists: 0,
      yellow: 0,
      red: 0,
    };
    return (
      <PlayerChip
        id={
          p.player_id ?? (typeof p.player === "number" ? p.player : p.player?.id) ?? null
        }
        clubId={getClubId(p)}
        name={toShort(nm)}
        number={p.number}
        photo={p.photo || p.player_photo}
        isCaptain={!!p.is_captain}
        note={getRating(p)}
        isMotm={isMotm(p)}
        ev={ev}
        raw={p}
        scale={chipScale}
      />
    );
  };

  return (
    <div className="border rounded-2xl p-4 bg-white/60">
      <div className="flex items-center gap-3 mb-3">
        <img
          src={logo || "/club-placeholder.png"}
          alt={title}
          className="w-10 h-10 object-contain"
        />
        <h3 className="text-base font-semibold">{title}</h3>
      </div>

      <Pitch>
        {gk && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-[8%]">
            {chipFor(gk)}
          </div>
        )}
        {rows.map((line, i) => {
          const bottoms = ["35%", "52%", "70%", "80%"];
          const bottom = bottoms[i] || `${80 - i * 12}%`;
          const count = Math.max(line.length, 1);
          return (
            <div key={i} className="absolute inset-x-3" style={{ bottom }}>
              <div
                className="grid"
                style={{
                  gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
                  columnGap: 24,
                }}
              >
                {line.map((p, idx) => (
                  <div key={idx} className="flex justify-center">
                    {chipFor(p)}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </Pitch>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-2">
        <div className="flex items-center gap-2 text-emerald-700 font-medium">
          {formation && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
              {formation}
            </span>
          )}
          {badgeAvg}
        </div>
        {coachName && (
          <div className="text-right text-gray-700">
            <span className="text-gray-500 mr-1">Coach</span>
            <span className="font-medium">{coachName}</span>
          </div>
        )}
      </div>

      {subs?.length ? (
        <div className="mt-4">
          <h4 className="text-sm font-semibold tracking-wide text-gray-700 mb-2">
            REMPLAÇANTS
          </h4>
          <ul className="divide-y rounded-xl ring-1 ring-gray-100 bg-white/70">
            {subs.map((p, i) => {
              const nmFull = bestNameFor(p);
              const nm = toShort(nmFull);
              const rating = getRating(p);
              const ratingClass =
                rating == null
                  ? ""
                  : rating < 5
                  ? "bg-red-100 text-red-700"
                  : rating < 7.5
                  ? "bg-blue-100 text-blue-700"
                  : "bg-green-100 text-green-700";
              const ev = evStats[normName(nmFull)] || {
                goals: 0,
                assists: 0,
                yellow: 0,
                red: 0,
              };

              const { openSheet, openSheetSmart } = usePlayerSheet();

              return (
                <li
                  key={`sb-${p.id || i}`}
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 text-[13px]"
                >
                  <img
                    src={p.photo || p.player_photo || "/player-placeholder.png"}
                    alt={nmFull || "Joueur"}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 shrink-0"
                    onError={(e) => {
                      e.currentTarget.src = "/player-placeholder.png";
                    }}
                    onClick={() => {
                      const pid =
                        p.player_id ?? (typeof p.player === "number" ? p.player : p.player?.id) ?? null;
                      if (pid) openSheet(pid);
                      else
                        openSheetSmart({
                          name: nmFull,
                          clubId: getClubId(p),
                        });
                    }}
                    title={nmFull}
                  />

                  <div className="flex min-w-0 flex-1 items-center gap-2">
                    <span className="tabular-nums text-gray-700 shrink-0">
                      {Number.isFinite(Number(p.number)) ? String(p.number) : ""}
                    </span>
                    <span className="truncate font-medium" title={nmFull}>
                      {nm}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[11px] text-gray-500">
                    <span className="uppercase tracking-wide">{p.position || ""}</span>

                    {(ev.goals > 0 || ev.assists > 0) && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-gray-700">
                        {ev.goals > 0 && (
                          <>
                            <BallIcon size={14} />
                            {ev.goals > 1 ? ev.goals : ""}
                          </>
                        )}
                        {ev.assists > 0 && (
                          <>
                            <AssistIconImg size={14} />
                            {ev.assists > 1 ? ev.assists : ""}
                          </>
                        )}
                      </span>
                    )}

                    {(ev.yellow > 0 || ev.red > 0) && (
                      <span className="inline-flex items-center gap-1">
                        {Array.from({ length: ev.yellow }).map((_, k) => (
                          <span key={`yb-${k}`} className="w-2.5 h-3.5 bg-yellow-300 border border-yellow-600 rounded-sm" />
                        ))}
                        {Array.from({ length: ev.red }).map((_, k) => (
                          <span key={`rb-${k}`} className="w-2.5 h-3.5 bg-red-500 border border-red-700 rounded-sm" />
                        ))}
                      </span>
                    )}

                    {rating != null && (
                      <span className={`text-[11px] font-semibold rounded px-1 ${ratingClass}`}>
                        {rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

/* ===== Normalisation réponses /lineups ===== */
const normalizeLineupsResponse = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.results)) return raw.results;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.lineups)) return raw.lineups;
  return [];
};

/* ===== Fallback admin rapide ===== */
const normalizeQuickAdminToFlat = (quick, matchId) => {
  if (!quick || typeof quick !== "object") return [];
  const { home = {}, away = {} } = quick;
  const parseClub = (c) => {
    if (c == null) return null;
    const n = Number(c);
    return Number.isFinite(n) ? n : c;
  };
  const homeClubId = parseClub(home.club_id ?? home.club);
  const awayClubId = parseClub(away.club_id ?? away.club);

  const pick = (arr, clubId, is_starting) =>
    (arr || []).map((r, idx) => ({
      id: r.id ?? null,
      match: Number(matchId),
      club: Number.isFinite(Number(clubId)) ? Number(clubId) : clubId,
      is_starting: !!r.is_starting,
      player_name: r.name || "",
      number: r.number ?? null,
      position: r.position || "",
      is_captain: !!r.is_captain,
      rating: r.rating ?? null,
      photo: null,
      player_photo: null,
      seq: r.seq ?? idx, // FALLBACK : ordre stable
    }));

  return [
    ...pick(home?.xi, homeClubId, true),
    ...pick(home?.bench, homeClubId, false),
    ...pick(away?.xi, awayClubId, true),
    ...pick(away?.bench, awayClubId, false),
  ];
};

/* ===== Fallback depuis le détail match ===== */
const toName = (p = {}) =>
  p.player_name ||
  p.name ||
  [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
const toNum = (p = {}) =>
  p.number ?? p.shirt_number ?? p.jersey_number ?? p.no ?? null;
const toPos = (p = {}) => p.position || p.pos || p.role || "";
const toPhoto = (p = {}) => p.photo || p.player_photo || p.picture || p.image_url || null;

function deriveLineupsFromMatch(m) {
  if (!m) return { items: [], meta: {} };
  const pick = (...keys) => keys.map((k) => m?.[k]).find((v) => Array.isArray(v)) || [];
  const homeStarters = pick("home_lineup","home_xi","home_starting","home_players_starting","home_players");
  const homeSubs = pick("home_subs","home_bench","home_reserves");
  const awayStarters = pick("away_lineup","away_xi","away_starting","away_players_starting","away_players");
  const awaySubs = pick("away_subs","away_bench","away_reserves");

  const normalize = (arr, clubId, is_starting) =>
    (arr || []).map((p, idx) => ({
      id: p.id,
      club: clubId,
      is_starting,
      player_name: toName(p),
      number: toNum(p),
      position: toPos(p),
      photo: toPhoto(p),
      is_captain: !!(p.captain || p.is_captain),
      rating: p.rating ?? p.note ?? null,
      player_id: p.player_id ?? (typeof p.player === "number" ? p.player : p.player?.id),
      seq: p.seq ?? idx,
    }));

  const items = [
    ...normalize(homeStarters, m.home_club, true),
    ...normalize(homeSubs, m.home_club, false),
    ...normalize(awayStarters, m.away_club, true),
    ...normalize(awaySubs, m.away_club, false),
  ];

  const meta = {
    homeFormation: m.home_formation || m.formation_home || m.formation,
    awayFormation: m.away_formation || m.formation_away || m.formation,
    homeCoach: m.home_coach_name || m.home_coach,
    awayCoach: m.away_coach_name || m.away_coach,
  };

  return { items, meta };
}

/* ===================== Page MatchDetail ===================== */
export default function MatchDetail() {
  const { id } = useParams();
  const { openSheet } = usePlayerSheet();

  const [m, setM] = useState(null);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState("events");
  const [lineups, setLineups] = useState([]); // tableau plat d'items
  const [loadingCompo, setLoadingCompo] = useState(false);
  const [derived, setDerived] = useState({ items: [], meta: {} });
  const [teamInfo, setTeamInfo] = useState({
    home: { formation: null, coach_name: null },
    away: { formation: null, coach_name: null },
  });

  // helper to produce a stable key for a lineup item (to match with local state)
  const lineupKey = (it) => {
    if (!it) return null;
    if (it.player_id != null) return `pid:${it.player_id}`;
    if (it.player != null && typeof it.player === "number") return `pid:${it.player}`;
    if (it.id != null) return `id:${it.id}`;
    if (it.player_name) return `name:${String(it.player_name).trim().toLowerCase()}`;
    return null;
  };

  useEffect(() => {
    setLoad(true);
    api
      .get(`matches/${id}/`)
      .then((res) => {
        setM(res.data);
        const fromDetail = normalizeLineupsResponse(res.data?.lineups);
        if (fromDetail.length) {
          // si lineups fournis, préserver l'ordre tel que renvoyé par le serveur,
          // mais garantir seq stable (fallback index) — on ne force pas un tri supplémentaire
          const items = fromDetail.slice().map((it, idx) => ({
            ...it,
            seq: Number.isFinite(Number(it.seq)) ? Number(it.seq) : idx,
          }));
          setLineups(items);
        }
      })
      .catch((e) => setError(e.message || "Erreur"))
      .finally(() => setLoad(false));
  }, [id]);

  useEffect(() => {
    if (!m) return;
    const d = deriveLineupsFromMatch(m);
    setDerived(d);
    if (!lineups.length && d.items.length) {
      // garder l'ordre renvoyé par deriveLineupsFromMatch mais garantir seq stable
      const items = d.items.slice().map((it, idx) => ({
        ...it,
        seq: Number.isFinite(Number(it.seq)) ? Number(it.seq) : idx,
      }));
      setLineups(items);
    }

    api
      .get(`matches/${id}/team-info/`)
      .then((res) => {
        const h = res.data?.home || {};
        const a = res.data?.away || {};
        setTeamInfo({
          home: {
            formation: h.formation || null,
            coach_name: h.coach_name || null,
          },
          away: {
            formation: a.formation || null,
            coach_name: a.coach_name || null,
          },
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, id]);

  const rawStatus = (m?.status || "").toUpperCase().trim();
  let badgeLabel = null;
  if (
    rawStatus.includes("FT") ||
    rawStatus === "FINISHED" ||
    rawStatus === "FULL TIME"
  ) {
    badgeLabel = "FT";
  } else if (
    rawStatus.includes("HT") ||
    rawStatus.includes("HALF") ||
    rawStatus === "HALF TIME" ||
    rawStatus === "HALF-TIME"
  ) {
    badgeLabel = "HT";
  } else if (
    rawStatus.includes("LIVE") ||
    rawStatus.includes("IN PLAY") ||
    rawStatus.includes("2ND HALF") ||
    rawStatus.includes("FIRST HALF") ||
    rawStatus.includes("1ST HALF") ||
    rawStatus.includes("1ST") ||
    rawStatus.includes("2ND")
  ) {
    badgeLabel = "LIVE";
  }

  const loadLineupsFresh = async () => {
    setLoadingCompo(true);
    try {
      const res = await api.get(`matches/${id}/lineups/`);
      let items = normalizeLineupsResponse(res.data);

      if (!items.length) {
        const alt = await api.get(`matches/admin/lineups/api/`, {
          params: { action: "list", match_id: id },
        });
        items = normalizeQuickAdminToFlat(alt.data, id);
      }

      if (items && items.length) {
        // --- Merge seq from local `lineups` state when possible (preserve user's order) ---
        const existingMap = {};
        (lineups || []).forEach((it) => {
          const k = lineupKey(it);
          if (k) existingMap[k] = it;
        });

        // compute stable seq for each incoming item:
        const incoming = items.slice().map((it, idx) => {
          const k = lineupKey(it);
          let seq = null;
          if (k && existingMap[k] && Number.isFinite(Number(existingMap[k].seq))) {
            // reuse seq previously stored locally
            seq = Number(existingMap[k].seq);
          } else if (Number.isFinite(Number(it.seq))) {
            seq = Number(it.seq);
          } else {
            seq = idx; // fallback stable index
          }
          return { ...it, seq };
        });

        // final sort by seq ascending (stable)
        incoming.sort((a, b) => (Number(a.seq ?? 0) - Number(b.seq ?? 0)));

        // ensure seq are compact/unique to avoid ties (reassign if duplicates)
        const seen = new Set();
        const normalized = incoming.map((it, i) => {
          let s = Number(it.seq ?? i);
          while (seen.has(s)) s = s + 1;
          seen.add(s);
          return { ...it, seq: s };
        });

        setLineups(normalized);
      }

      const ti = await api.get(`matches/${id}/team-info/`);
      const h = ti.data?.home || {};
      const a = ti.data?.away || {};
      setTeamInfo({
        home: { formation: h.formation || null, coach_name: h.coach_name || null },
        away: { formation: a.formation || null, coach_name: a.coach_name || null },
      });
    } catch (e) {
      // ignore silently
    }
    setLoadingCompo(false);
  };

  useEffect(() => {
    if (tab !== "compos") return;
    loadLineupsFresh();
    const t = setInterval(loadLineupsFresh, 10000);
    return () => clearInterval(t);
  }, [tab, id]);

  const onClickTab = async (next) => {
    setTab(next);
    if (next === "compos") await loadLineupsFresh();
    const y = window.scrollY - 8;
    window.scrollTo({ top: y < 0 ? 0 : y, behavior: "smooth" });
  };

  // Avant d'extraire starters/subs, s'assurer que `lineups` est trié par seq
  const sortedLineups = useMemo(() => {
    if (!Array.isArray(lineups)) return [];
    const copy = lineups.slice().map((it, idx) => ({
      ...it,
      seq: Number.isFinite(Number(it.seq)) ? Number(it.seq) : idx,
    }));
    // sort by seq ascending; seqs have been normalized at ingestion
    return copy.sort((a, b) => (Number(a.seq ?? 0) - Number(b.seq ?? 0)));
  }, [lineups]);

  // Sépare home/away et starting/subs, puis enforce positions by order
  const homeStarters = useMemo(() => {
    const arr = (sortedLineups || []).filter((p) => clubEq(p, m?.home_club) && isStarting(p));
    // Important : on applique l'enforcement sur l'ordre d'apparition (après tri seq)
    return enforcePositionsByOrder(arr);
  }, [sortedLineups, m]);

  const homeSubs = useMemo(() => (sortedLineups || []).filter((p) => clubEq(p, m?.home_club) && !isStarting(p)), [sortedLineups, m]);

  const awayStarters = useMemo(() => {
    const arr = (sortedLineups || []).filter((p) => clubEq(p, m?.away_club) && isStarting(p));
    return enforcePositionsByOrder(arr);
  }, [sortedLineups, m]);

  const awaySubs = useMemo(() => (sortedLineups || []).filter((p) => clubEq(p, m?.away_club) && !isStarting(p)), [sortedLineups, m]);

  const globalMotmId = useMemo(() => {
    const starters = [...homeStarters, ...awayStarters];
    let best = null,
      bestVal = -1;
    starters.forEach((p) => {
      const n = getRating(p);
      if (n != null && n > bestVal) {
        bestVal = n;
        best = p;
      }
    });
    return best?.id ?? null;
  }, [homeStarters, awayStarters]);

  const homeFormation =
    teamInfo.home.formation || derived.meta.homeFormation || m?.home_formation || m?.formation;
  const awayFormation =
    teamInfo.away.formation || derived.meta.awayFormation || m?.away_formation || m?.formation;

  const homeCoach =
    teamInfo.home.coach_name || derived.meta.homeCoach || m?.home_coach_name || m?.home_coach;
  const awayCoach =
    teamInfo.away.coach_name || derived.meta.awayCoach || m?.away_coach_name || m?.away_coach;

  /* ---------- Timeline (évènements) ---------- */
  const _truthy = (v) =>
    v === true ||
    v === 1 ||
    v === "1" ||
    (typeof v === "string" && ["true", "yes", "y"].includes(v.toLowerCase()));
  const goalTag = (g = {}) => {
    const t = (g.type || g.kind || "").toString().toUpperCase();
    const isPen =
      _truthy(g.penalty) ||
      _truthy(g.is_penalty) ||
      _truthy(g.on_penalty) ||
      ["PEN", "P", "PK", "PENALTY"].includes(t);
    const isOG =
      _truthy(g.own_goal) ||
      _truthy(g.is_own_goal) ||
      _truthy(g.og) ||
      ["OG", "CSC", "OWN_GOAL", "OWNGOAL"].includes(t);
    return isPen ? " (pen.)" : isOG ? " (csc)" : "";
  };
  const playerLabelEv = (ev = {}) => {
    if (ev.player_name) return ev.player_name;
    if (typeof ev.player === "number") return `Joueur #${ev.player}`;
    const first = ev?.player?.first_name || ev.player_first_name || "";
    const last = ev?.player?.last_name || ev.player_last_name || "";
    const full = `${first} ${last}`.trim();
    return full || "Inconnu";
  };
  const assistLabel = (ev = {}) => {
    const txt =
      ev.assist_name ||
      ev.assist ||
      ev.assist_player_name ||
      (ev.assist &&
        (ev.assist.first_name
          ? `${ev.assist.first_name} ${ev.assist.last_name || ""}`.trim()
          : null));
    return (txt || "").trim() || null;
  };
  const cardEmoji = (ev) => {
    const v = (ev?.color ?? ev?.type ?? ev?.card ?? ev?.card_type ?? "")
      .toString()
      .toUpperCase();
    if (v === "R" || v.includes("RED") || v.includes("ROUGE")) return "🟥";
    if (v === "Y" || v.includes("YELLOW") || v.includes("JAUNE")) return "🟨";
    return "🟨";
  };

  const timeline = useMemo(() => {
    if (!m) return [];
    const homeId = Number(m.home_club);

    const goals = (m.goals || []).map((g) => ({
      kind: "goal",
      minute: g.minute ?? g.time ?? g.min ?? null,
      club: Number(g.club ?? g.club_id),
      raw: g,
      onHomeSide: Number(g.club ?? g.club_id) === homeId,
    }));

    const cards = (m.cards || []).map((c) => ({
      kind: "card",
      minute: c.minute ?? c.time ?? c.min ?? null,
      club: Number(c.club ?? c.club_id),
      raw: c,
      onHomeSide: Number(c.club ?? c.club_id) === homeId,
    }));

    return [...goals, ...cards].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
  }, [m]);

  const eventStats = useMemo(() => buildEventStats(m || {}), [m]);

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="text-red-600">Erreur : {error}</p>;
  if (!m) return <p>Match introuvable.</p>;

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      {/* En-tête */}
      <div className="relative bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4">
        {badgeLabel && (
          <div
            className={
              badgeLabel === "LIVE"
                ? "absolute right-3 top-3 z-[10] text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 ring-1 ring-red-200 pointer-events-none"
                : badgeLabel === "HT"
                ? "absolute right-3 top-3 z-[10] text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-200 pointer-events-none"
                : "absolute right-3 top-3 z-[10] text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 pointer-events-none"
            }
          >
            {badgeLabel}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Logo src={m.home_club_logo} alt={m.home_club_name} />
            <span className="font-semibold whitespace-normal break-words">
              {m.home_club_name}
            </span>
          </div>

          <div className="text-center">
            <div className="text-3xl font-extrabold leading-none">
              {m.home_score}
              <span className="text-gray-400"> - </span>
              {m.away_score}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {fmtDate(m.datetime)}
              {m.venue ? ` • ${m.venue}` : ""}
            </div>
          </div>

          <div className="flex items-center gap-3 justify-end min-w-0">
            <span className="font-semibold whitespace-normal break-words text-right">
              {m.away_club_name}
            </span>
            <Logo src={m.away_club_logo} alt={m.away_club_name} />
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="sticky top-0 z-[60] isolate bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex gap-6 border-b pointer-events-auto">
            {[
              { key: "events", label: "ÉVÉNEMENTS" },
              { key: "compos", label: "COMPOS" },
            ].map(({ key, label }) => {
              const isActive = tab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onClickTab(key)}
                  className={`relative -mb-px py-3 text-sm font-semibold tracking-wide transition ${
                    isActive ? "text-emerald-700" : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {label}
                  <span
                    className={`absolute left-0 -bottom-[1px] h-[2px] w-full ${
                      isActive ? "bg-emerald-600" : "bg-transparent"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenu */}
      {tab === "events" ? (
        <section aria-labelledby="events-panel">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4">
            <h2 id="events-panel" className="text-lg font-semibold mb-3">
              Événements
            </h2>
            {!timeline.length && <p className="text-gray-500">Aucun événement pour le moment.</p>}

            <div className="divide-y">
              {timeline.map((ev, idx) => {
                const min = ev.minute ?? "?";

                if (ev.kind === "goal") {
                  const g = ev.raw;
                  const pFull = playerLabelEv(g);
                  const aFull = assistLabel(g);
                  const pShort = toShort(pFull);
                  const aShort = aFull ? toShort(aFull) : null;
                  const pPhoto = playerPhoto(g);
                  const pId = getEventPlayerId(g);

                  return (
                    <div key={`g-${idx}-${min}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2">
                      {/* Côté home */}
                      <div className="flex items-start gap-2 min-w-0">
                        {ev.onHomeSide && (
                          <>
                            <span className="text-sm text-gray-500 tabular-nums shrink-0">{min}'</span>

                            <TinyAvatar src={pPhoto} alt={pFull} size={32} onClick={pId ? () => openSheet(pId) : undefined} />

                            <div className="min-w-0">
                              <div className="flex items-center flex-nowrap gap-2 min-w-0">
                                <span className="font-medium text-[10px] sm:text-[10px] whitespace-nowrap text-gray-900" style={{ letterSpacing: "-0.2px" }} title={pFull}>
                                  {pShort}
                                  {goalTag(g)}
                                </span>
                                <BallIcon size={14} />
                              </div>

                              {aFull && (
                                <div className="mt-1 flex items-center flex-nowrap gap-1 text-[10px] text-gray-500 leading-none">
                                  <span className="truncate max-w-[140px]" title={aFull}>
                                    {aShort}
                                  </span>
                                  <AssistIconImg />
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="text-center text-sm text-gray-600" />

                      {/* Côté away */}
                      <div className="flex items-start gap-2 justify-end min-w-0">
                        {!ev.onHomeSide && (
                          <>
                            <span className="text-sm text-gray-500 tabular-nums shrink-0">{min}'</span>

                            <TinyAvatar src={pPhoto} alt={pFull} size={32} onClick={pId ? () => openSheet(pId) : undefined} />

                            <div className="min-w-0 text-right">
                              <div className="flex items-center flex-nowrap gap-2 whitespace-nowrap justify-end">
                                <span className="font-medium text-[10px] leading-none truncate max-w-[160px] text-right" title={pFull}>
                                  {pShort}
                                  {goalTag(g)}
                                </span>
                                <BallIcon />
                              </div>

                              {aFull && (
                                <div className="mt-1 flex items-center flex-nowrap gap-1 text-[10px] text-gray-500 leading-none justify-end">
                                  <span className="truncate max-w-[140px] text-right" title={aFull}>
                                    {aShort}
                                  </span>
                                  <AssistIconImg />
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  );
                }

                // CARTON
                const c = ev.raw;
                const emoji = cardEmoji(c);
                const pFull = c.player_name || "Inconnu";
                const pShort = toShort(pFull);
                const cPhoto = c.player_photo || null;
                const pId = getEventPlayerId(c);

                return (
                  <div key={`c-${idx}-${min}`} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {ev.onHomeSide && (
                        <>
                          <span className="text-sm text-gray-500 tabular-nums shrink-0">{min}'</span>

                          <span className="inline-flex items-center justify-center w-5 h-5 leading-none shrink-0">{emoji}</span>

                          <TinyAvatar src={cPhoto} alt={pFull} size={32} onClick={pId ? () => openSheet(pId) : undefined} />

                          <div className="min-w-0">
                            <div className="flex items-center flex-nowrap gap-1 text-[10px] font-medium text-gray-900 leading-none whitespace-nowrap">
                              <span className="truncate max-w-[160px]" title={pFull}>
                                {pShort}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <div className="text-center text-sm text-gray-600" />

                    <div className="flex items-start gap-2 justify-end min-w-0">
                      {!ev.onHomeSide && (
                        <>
                          <span className="text-sm text-gray-500 tabular-nums shrink-0">{min}'</span>

                          <span className="inline-flex items-center justify-center w-5 h-5 leading-none shrink-0">{emoji}</span>

                          <TinyAvatar src={cPhoto} alt={pFull} size={32} onClick={pId ? () => openSheet(pId) : undefined} />

                          <div className="min-w-0 text-right">
                            <div className="flex items-center flex-nowrap gap-1 text-[10px] font-medium text-gray-900 leading-none whitespace-nowrap justify-end">
                              <span className="truncate max-w-[160px] text-right" title={pFull}>
                                {pShort}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <section aria-labelledby="compos-panel">
          <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-300 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 id="compos-panel" className="text-lg font-semibold">
                Compositions
              </h2>
            </div>

            {/* 1 colonne mobile, 2 colonnes md+ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <TeamLineupCard
                title={m.home_club_name}
                logo={m.home_club_logo}
                starters={homeStarters}
                subs={homeSubs}
                formation={homeFormation}
                coachName={homeCoach}
                teamAvg={m.avg_rating_home}
                motmId={globalMotmId}
                evStats={eventStats}
                chipScale={0.55}
              />
              <TeamLineupCard
                title={m.away_club_name}
                logo={m.away_club_logo}
                starters={awayStarters}
                subs={awaySubs}
                formation={awayFormation}
                coachName={awayCoach}
                teamAvg={m.avg_rating_away}
                motmId={globalMotmId}
                evStats={eventStats}
                chipScale={0.55}
              />
            </div>
          </div>
        </section>
      )}
    </section>
  );
}
