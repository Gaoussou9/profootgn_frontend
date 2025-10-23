// src/pages/MatchDetail.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import { usePlayerSheet } from "../components/PlayerSheet";

/* ------------ Icône assist (crampon) ------------ */
const ASSIST_ICON_SRC = "/icons/cleat_20.png";
const AssistIconImg = ({ size = 18 }) => (
  <img
    src={ASSIST_ICON_SRC}
    alt="Assist"
    width={size}
    height={size}
    className="inline-block object-contain align-middle shrink-0"
    onError={(e) => { e.currentTarget.outerHTML = "A"; }}
  />
);
/* ------------------------------------------------ */

const Logo = ({ src, alt, size = "w-12 h-12" }) => (
  <img
    src={src || "/club-placeholder.png"}
    alt={alt}
    className={`${size} rounded-md ring-1 ring-black/10 bg-white object-contain shrink-0`}
    onError={(e) => (e.currentTarget.src = "/club-placeholder.png")}
  />
);

const TinyAvatar = ({ src, alt, size = 32, onClick }) => (
  <img
    src={src || "/player-placeholder.png"}
    alt={alt || "Joueur"}
    width={size}
    height={size}
    className={`rounded-full object-cover ring-1 ring-gray-200 shrink-0 ${onClick ? "cursor-pointer" : ""}`}
    onError={(e) => (e.currentTarget.src = "/player-placeholder.png")}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
    title={onClick ? `Voir la fiche de ${alt || "ce joueur"}` : alt}
  />
);

const BallIcon = ({ size = 18 }) => (
  <span className="inline-flex items-center justify-center leading-none select-none shrink-0" style={{ width: size, height: size }} aria-hidden>⚽</span>
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

const statusClasses = (s) => {
  switch ((s || "").toUpperCase()) {
    case "LIVE":       return "bg-red-100 text-red-700 ring-1 ring-red-200";
    case "HT":
    case "PAUSED":     return "bg-amber-100 text-amber-700 ring-1 ring-amber-200";
    case "SCHEDULED":
    case "NOT_STARTED":return "bg-blue-100 text-blue-700 ring-1 ring-blue-200";
    case "SUSPENDED":  return "bg-zinc-100 text-zinc-700 ring-1 ring-zinc-200";
    case "POSTPONED":  return "bg-sky-100 text-sky-700 ring-1 ring-sky-200";
    case "CANCELED":
    case "CANCELLED":  return "bg-rose-100 text-rose-700 ring-1 ring-rose-200";
    case "FINISHED":
    case "FT":         return "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200";
    default:           return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  }
};

const statusLabel = (s) => {
  switch ((s || "").toUpperCase()) {
    case "SCHEDULED": return "Prévu";
    case "NOT_STARTED": return "À venir";
    case "LIVE": return "LIVE";
    case "HT": return "Mi-temps";
    case "PAUSED": return "Pause";
    case "SUSPENDED": return "Suspendu";
    case "POSTPONED": return "Reporté";
    case "CANCELED":
    case "CANCELLED": return "Annulé";
    case "FT":
    case "FINISHED": return "FT";
    default: return s || "-";
  }
};

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString() : "");

/* ------------------ Live clock ------------------ */
function useLiveClock(matchId, status, apiMinute) {
  const upper = (status || "").toUpperCase();
  const isLive = upper === "LIVE";
  const isBreak = upper === "HT" || upper === "PAUSED";

  const base = `gn:live:${matchId}`;
  const kAnchor  = `${base}:anchor`;
  const kBest    = `${base}:best`;
  const kLastApi = `${base}:lastApi`;
  const kHalf2   = `${base}:half2`;
  const kStart   = `${base}:startSnapApplied`;

  const [minute, setMinute] = useState(null);
  const [isSecondHalf, setIsSecondHalf] = useState(false);
  const timerRef = useRef(null);

  const readNum = (k, d=null)=>{ try{const n=Number(localStorage.getItem(k));return Number.isFinite(n)?n:d;}catch{return d;} };
  const readStr = (k)=>{ try{return localStorage.getItem(k);}catch{return null;} };
  const write   = (k,v)=>{ try{localStorage.setItem(k,String(v));}catch{} };
  const del     = (k)=>{ try{localStorage.removeItem(k);}catch{} };

  useEffect(() => {
    if (upper === "FT" || upper === "FINISHED") {
      [kAnchor,kBest,kLastApi,kHalf2,kStart].forEach(del);
      setMinute(null); setIsSecondHalf(false); return;
    }
    if (isBreak) {
      write(kHalf2,"1");
      const best = readNum(kBest,0);
      if (best < 45) write(kBest,45);
      setIsSecondHalf(true);
      return;
    }
    if (!isLive) { setMinute(null); return; }

    const now = Date.now();
    let apiMin = parseInt(apiMinute,10);
    if (!Number.isFinite(apiMin) || apiMin < 0) apiMin = 0;
    const lastApi = readNum(kLastApi,-1);
    if (Number.isFinite(lastApi) && apiMin < lastApi - 2) apiMin = lastApi;
    if (apiMin > (lastApi ?? -1)) write(kLastApi, apiMin);

    if (!readStr(kHalf2) && apiMin >= 46) write(kHalf2,"1");
    const h2 = readStr(kHalf2) === "1";
    setIsSecondHalf(h2);

    let anchor = readNum(kAnchor,null);
    let best   = readNum(kBest,null);
    if (!Number.isFinite(best) && Number.isFinite(anchor)) {
      const displayed = Math.max(0, Math.floor((now - anchor)/60000));
      best = displayed; write(kBest,best);
    }
    if (!Number.isFinite(best)) best = 0;

    const placeAnchor = (m) => { const a = now - Math.max(0,m)*60000; write(kAnchor,a); return a; };

    if (!Number.isFinite(anchor)) {
      anchor = placeAnchor(Math.max(apiMin, best));
    } else {
      const displayed = Math.max(0, Math.floor((now - anchor)/60000));
      if (readStr(kStart)!=="1" && apiMin<=2 && best<=2 && displayed>apiMin+2) {
        anchor = placeAnchor(apiMin); write(kStart,"1");
      }
      const candidate = Math.max(apiMin, best, displayed);
      if (candidate - displayed > 3) anchor = placeAnchor(candidate);
    }

    if (timerRef.current) clearInterval(timerRef.current);
    const tick = () => {
      const a = readNum(kAnchor,anchor);
      let m = Math.max(0, Math.floor((Date.now() - a)/60000));
      const hh2 = readStr(kHalf2) === "1";
      if (hh2 && m < 45) m = 45;
      setMinute(m); setIsSecondHalf(hh2);
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [upper, isLive, isBreak, apiMinute, matchId]);

  return { minute, isSecondHalf };
}

function formatMinuteForBadge(status, minute, isSecondHalf) {
  const upper = (status || "").toUpperCase();
  if (upper === "HT" || upper === "PAUSED") return "HT";
  if (upper !== "LIVE") return null;
  const n = Math.max(0, Number(minute ?? 0));
  if (isSecondHalf) return n >= 90 ? "90’+" : `${n}'`;
  return n >= 45 ? "45’+" : `${n}'`;
}

/* ---------- Row (timeline) ---------- */
const Row = ({ left, center, right }) => (
  <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3 py-2">
    <div className="flex items-center gap-2 min-w-0">{left}</div>
    <div className="text-center text-sm text-gray-600">{center}</div>
    <div className="flex items-center gap-2 justify-end min-w-0">{right}</div>
  </div>
);

/* ===================== helpers noms & note ===================== */
const displayName = (p = {}) =>
  p.player_display || p.player_name || p.name ||
  [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
  (p.player && [p.player.first_name, p.player.last_name].filter(Boolean).join(" ").trim()) || "";

const shortName = (p = {}) => {
  const first = p.first_name ?? p.player_first_name ?? p.player?.first_name ?? null;
  const last  = p.last_name ?? p.player_last_name ?? p.player?.last_name ?? null;
  if (first && last) return `${(first.trim()[0] || "").toUpperCase()}. ${last}`.trim();
  const full = displayName(p);
  if (full) {
    const parts = full.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${(parts[0][0] || "").toUpperCase()}. ${parts.at(-1)}`;
    return full;
  }
  return "";
};

const getRating = (p = {}) => {
  let v = p.rating ?? p.note ?? p.score ?? p.player?.rating ?? p.player?.note ?? p.player?.score ?? null;
  if (typeof v === "string") v = v.replace(",", ".").trim();
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
};

/* ===== Robust mapping helpers ===== */
const getClubId = (p) => {
  if (p == null) return null;
  if (typeof p.club === "number") return p.club;
  if (typeof p.club_id === "number") return p.club_id;
  if (typeof p.club === "string" && /^\d+$/.test(p.club)) return Number(p.club);
  if (typeof p.club_id === "string" && /^\d+$/.test(p.club_id)) return Number(p.club_id);
  if (p.club && typeof p.club.id === "number") return p.club.id;
  return null;
};
const clubEq = (p, id) => String(getClubId(p)) === String(id);
const isStarting = (p) => {
  const v = p.is_starting ?? p.starter ?? p.starting ?? null;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  if (typeof v === "string") return ["1","true","yes","y"].includes(v.toLowerCase());
  return !!v;
};

/* ===================== Événements -> stats par joueur ===================== */
const normName = (s) => (String(s || "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase());
const bestNameFor = (p) => displayName(p) || shortName(p) || p.player_name || [p.first_name, p.last_name].filter(Boolean).join(" ").trim();

function buildEventStats(m) {
  const stats = {};
  const bump = (name, field) => {
    if (!name) return;
    const k = normName(name);
    if (!stats[k]) stats[k] = { goals: 0, assists: 0, yellow: 0, red: 0 };
    stats[k][field] += 1;
  };

  (m.goals || []).forEach(g => {
    bump(g.player_name || g.player?.name || bestNameFor(g.player || {}), "goals");
    const a = g.assist_name || g.assist_player_name ||
      (g.assist && (g.assist.name || `${g.assist.first_name || ""} ${g.assist.last_name || ""}`).trim());
    if (a) bump(a, "assists");
  });

  (m.cards || []).forEach(c => {
    const nm = c.player_name || c.player?.name || bestNameFor(c.player || {});
    const typ = (c.color ?? c.type ?? "").toString().toUpperCase();
    if (typ === "R" || typ.includes("RED")) bump(nm, "red");
    else bump(nm, "yellow");
  });

  return stats;
}

/* ===================== COMPOS – PlayerChip ===================== */
const PlayerChip = ({
  id, clubId, name, number, photo,
  isCaptain = false, note = null, isMotm = false,
  ev = { goals: 0, assists: 0, yellow: 0, red: 0 },
  raw,
}) => {
  const { openSheet, openSheetSmart } = usePlayerSheet();
  const label = (name && String(name).trim()) || "";
  const showNote = Number.isFinite(Number(note)) && Number(note) > 0 ? Number(note) : null;

  const ratingClass =
    showNote == null ? "" :
    showNote < 5 ? "bg-red-100 text-red-700" :
    showNote < 7.5 ? "bg-blue-100 text-blue-700" :
    "bg-green-100 text-green-700";

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
    <div className="flex flex-col items-center select-none">
      <div className="relative w-16 h-16 rounded-full ring-2 ring-white shadow">
        <img
          src={photo || "/player-placeholder.png"}
          alt={label || "Joueur"}
          className="w-16 h-16 rounded-full object-cover cursor-pointer"
          onError={(e)=>{ e.currentTarget.src="/player-placeholder.png"; }}
          onClick={onClick}
        />
        {isMotm && (<span className="absolute -top-4 -left-4 text-yellow-400 text-4xl drop-shadow">★</span>)}
        {showNote != null && (<span className={`absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-semibold rounded px-1 ${ratingClass}`}>{showNote.toFixed(1)}</span>)}
        {(ev.goals > 0 || ev.assists > 0) && (
          <div className="absolute -top-1 -right-3 flex flex-col items-center gap-0.5">
            {ev.goals > 0 && (<span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/80 rounded px-1 ring-1 ring-gray-200"><BallIcon size={16} />{ev.goals > 1 ? ev.goals : ""}</span>)}
            {ev.assists > 0 && (<span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/80 rounded px-1 ring-1 ring-gray-200"><AssistIconImg size={16} />{ev.assists > 1 ? ev.assists : ""}</span>)}
          </div>
        )}
        {hasCards && (
          <div className="absolute top-1/2 left-0 flex flex-col gap-0.5">
            {Array.from({length: ev.yellow || 0}).map((_,i)=>(<span key={`y-${i}`} className="w-4 h-5 bg-yellow-300 border border-yellow-600 rounded-sm" />))}
            {Array.from({length: ev.red || 0}).map((_,i)=>(<span key={`r-${i}`} className="w-4 h-5 bg-red-500 border border-red-700 rounded-sm" />))}
          </div>
        )}
        {isCaptain && (<span className="absolute -bottom-1 -right-1 text-[11px] font-bold bg-sky-600 text-white rounded px-1">C</span>)}
        {Number.isFinite(Number(number)) && (<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[11px] font-bold bg-black/75 text-white rounded px-1">{number}</span>)}
      </div>
      <div className="mt-1 max-w-[120px] px-2 py-0.5 rounded-full bg-black text-white text-[11px] leading-tight overflow-hidden">
        <span className="line-clamp-2">{label}</span>
      </div>
    </div>
  );
};

/* ===== Helpers formation & terrain ===== */
const parseFormation = (formationStr, starters) => {
  if (typeof formationStr === "string" && /^\d+(-\d+)+$/.test(formationStr)) {
    return formationStr.split("-").map(n => Number(n));
  }
  const count = (prefix) => starters.filter(p => (p.position || "").toUpperCase().startsWith(prefix)).length;
  const d = count("D") || 4; const m = count("M") || 3; const f = count("F") || count("A") || 3;
  return [d, m, f];
};

const makeLines = (starters, formationStr) => {
  const GK = starters.filter(p => (p.position || "").toUpperCase().startsWith("G"));
  const field = starters.filter(p => !(p.position || "").toUpperCase().startsWith("G"));
  field.sort((a,b)=>(a.number??999)-(b.number??999) || String(displayName(a)).localeCompare(String(displayName(b))));
  const counts = parseFormation(formationStr, starters);
  const lines = [];
  lines.push(field.splice(0, counts[0]));
  lines.push(field.splice(0, counts[1]));
  lines.push(field.splice(0, counts[2]));
  if (field.length) lines.splice(1, 0, field);
  return { gk: GK[0] || null, rows: lines };
};

const Pitch = ({ children }) => (
  <div className="relative w-full rounded-2xl border bg-[linear-gradient(180deg,#1b7f3a_0%,#1a6d33_100%)]" style={{ aspectRatio: "16 / 18" }}>
    <div className="absolute inset-2 rounded-xl border-2 border-white/70 pointer-events-none" />
    <div className="absolute inset-y-2 left-1/2 w-0.5 bg-white/70 pointer-events-none" />
    <div className="absolute left-2 right-2 top-1/4 h-px bg-white/20 pointer-events-none" />
    <div className="absolute left-2 right-2 top-2/4 h-px bg-white/20 pointer-events-none" />
    <div className="absolute left-2 right-2 top-3/4 h-px bg-white/20 pointer-events-none" />
    {children}
  </div>
);

/* ===================== Carte équipe ===================== */
const TeamLineupCard = ({ title, logo, starters, subs, formation, coachName, teamAvg, motmId, evStats }) => {
  const { gk, rows } = makeLines(starters, formation);
  const isMotm = (p) => motmId != null && p && (p.id === motmId);

  const badgeAvg =
    Number.isFinite(Number(teamAvg)) ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
        {Number(teamAvg).toFixed(2)} moy. équipe
      </span>
    ) : null;

  const chipFor = (p) => {
    const nm = bestNameFor(p);
    const ev = evStats[normName(nm)] || { goals: 0, assists: 0, yellow: 0, red: 0 };
    return (
      <PlayerChip
        id={p.player_id ?? (typeof p.player === "number" ? p.player : p.player?.id) ?? null}
        clubId={getClubId(p)}
        name={shortName(p) || displayName(p)}
        number={p.number}
        photo={p.photo || p.player_photo}
        isCaptain={!!p.is_captain}
        note={getRating(p)}
        isMotm={isMotm(p)}
        ev={ev}
        raw={p}
      />
    );
  };

  const { openSheet, openSheetSmart } = usePlayerSheet();

  return (
    <div className="border rounded-2xl p-4 bg-white/60">
      <div className="flex items-center gap-3 mb-3">
        <img src={logo || "/club-placeholder.png"} alt={title} className="w-10 h-10 object-contain" />
        <h3 className="text-base font-semibold">{title}</h3>
      </div>

      <Pitch>
        {gk && (<div className="absolute left-1/2 -translate-x-1/2 bottom-[8%]">{chipFor(gk)}</div>)}
        {rows.map((line, i) => {
          const bottoms = ["35%", "52%", "70%", "80%"];
          const bottom = bottoms[i] || `${80 - i * 12}%`;
          const count = Math.max(line.length, 1);
          return (
            <div key={i} className="absolute inset-x-3" style={{ bottom }}>
              <div className="grid" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`, columnGap: 24 }}>
                {line.map((p, idx) => (<div key={idx} className="flex justify-center">{chipFor(p)}</div>))}
              </div>
            </div>
          );
        })}
      </Pitch>

      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-emerald-700 font-medium">
          {formation && <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">{formation}</span>}
          {badgeAvg}
        </div>
        {coachName && <div className="text-right"><span className="text-gray-500 mr-1">Coach</span><span className="font-medium">{coachName}</span></div>}
      </div>

      {subs?.length ? (
        <div className="mt-4">
          <h4 className="text-sm font-semibold tracking-wide text-gray-700 mb-2">REMPLAÇANTS</h4>
          <ul className="divide-y rounded-xl ring-1 ring-gray-100 bg-white/70">
            {subs.map((p, i) => {
              const nm = bestNameFor(p);
              const rating = getRating(p);
              const ratingClass =
                rating == null ? "" : rating < 5 ? "bg-red-100 text-red-700" : rating < 7.5 ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700";
              const ev = evStats[normName(nm)] || { goals: 0, assists: 0, yellow: 0, red: 0 };

              return (
                <li key={`sb-${p.id || i}`} className="flex items-center gap-2 px-3 py-2">
                  <img
                    src={p.photo || p.player_photo || "/player-placeholder.png"}
                    alt={nm || "Joueur"}
                    className="w-8 h-8 rounded-full object-cover ring-1 ring-gray-200"
                    onError={(e)=>{ e.currentTarget.src="/player-placeholder.png"; }}
                    onClick={() => {
                      const pid = p.player_id ?? (typeof p.player === "number" ? p.player : p.player?.id) ?? null;
                      if (pid) openSheet(pid); else openSheetSmart({ name: nm, clubId: getClubId(p) });
                    }}
                  />
                  <span className="tabular-nums w-8 text-gray-700">
                    {Number.isFinite(Number(p.number)) ? String(p.number) : ""}
                  </span>
                  <span className="flex-1 truncate">{nm || "—"}</span>
                  <span className="text-[11px] uppercase tracking-wide text-gray-500 mr-2">{p.position || ""}</span>
                  {(ev.goals > 0 || ev.assists > 0) && (
                    <span className="inline-flex items-center gap-1 mr-2 text-[11px]">
                      {ev.goals > 0 && (<><BallIcon size={14} />{ev.goals > 1 ? ev.goals : ""}</>)}
                      {ev.assists > 0 && (<><AssistIconImg size={14} />{ev.assists > 1 ? ev.assists : ""}</>)}
                    </span>
                  )}
                  {(ev.yellow > 0 || ev.red > 0) && (
                    <span className="inline-flex items-center gap-1 mr-2">
                      {Array.from({length: ev.yellow}).map((_,k)=><span key={`yb-${k}`} className="w-2.5 h-3.5 bg-yellow-300 border border-yellow-600 rounded-sm" />)}
                      {Array.from({length: ev.red}).map((_,k)=><span key={`rb-${k}`} className="w-2.5 h-3.5 bg-red-500 border border-red-700 rounded-sm" />)}
                    </span>
                  )}
                  {rating != null && (<span className={`text-[11px] font-semibold rounded px-1 ${ratingClass}`}>{rating.toFixed(1)}</span>)}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

/* ===== Normalisation / derive ===== */
const normalizeLineupsResponse = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.results)) return raw.results;
  if (Array.isArray(raw.data)) return raw.data;
  if (Array.isArray(raw.lineups)) return raw.lineups;
  return [];
};

const normalizeQuickAdminToFlat = (quick, matchId) => {
  if (!quick || typeof quick !== "object") return [];
  const { home, away } = quick;
  const pick = (arr, clubId, is_starting) =>
    (arr || []).map(r => ({
      id: r.id,
      match: Number(matchId),
      club: Number(clubId),
      is_starting: !!r.is_starting,
      player_name: r.name || "",
      number: r.number ?? null,
      position: r.position || "",
      is_captain: !!r.is_captain,
      rating: r.rating ?? null,
      photo: null,
      player_photo: null,
    }));
  return [
    ...pick(home?.xi,   home?.club_id, true),
    ...pick(home?.bench,home?.club_id, false),
    ...pick(away?.xi,   away?.club_id, true),
    ...pick(away?.bench,away?.club_id, false),
  ];
};

const toName  = (p={}) => p.player_name || p.name || [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
const toNum   = (p={}) => p.number ?? p.shirt_number ?? p.jersey_number ?? p.no ?? null;
const toPos   = (p={}) => p.position || p.pos || p.role || "";
const toPhoto = (p={}) => p.photo || p.player_photo || p.picture || p.image_url || null;

function deriveLineupsFromMatch(m) {
  if (!m) return { items: [], meta: {} };
  const pick = (...keys) => keys.map(k => m?.[k]).find(v => Array.isArray(v)) || [];
  const homeStarters = pick("home_lineup", "home_xi", "home_starting", "home_players_starting", "home_players");
  const homeSubs     = pick("home_subs", "home_bench", "home_reserves");
  const awayStarters = pick("away_lineup", "away_xi", "away_starting", "away_players_starting", "away_players");
  const awaySubs     = pick("away_subs", "away_bench", "away_reserves");

  const normalize = (arr, clubId, is_starting) =>
    (arr || []).map((p) => ({
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
    }));

  const items = [
    ...normalize(homeStarters, m.home_club, true),
    ...normalize(homeSubs,     m.home_club, false),
    ...normalize(awayStarters, m.away_club, true),
    ...normalize(awaySubs,     m.away_club, false),
  ];

  const meta = {
    homeFormation: m.home_formation || m.formation_home || m.formation,
    awayFormation: m.away_formation || m.formation_away || m.formation,
    homeCoach: m.home_coach_name || m.home_coach,
    awayCoach: m.away_coach_name || m.away_coach,
  };

  return { items, meta };
}

/* ===================== Page ===================== */
export default function MatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openSheet } = usePlayerSheet();

  const [m, setM] = useState(null);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState(null);

  const [tab, setTab] = useState("events");

  const [lineups, setLineups] = useState([]);
  const [loadingCompo, setLoadingCompo] = useState(false);

  const [derived, setDerived] = useState({ items: [], meta: {} });

  const [teamInfo, setTeamInfo] = useState({
    home: { formation: null, coach_name: null },
    away: { formation: null, coach_name: null },
  });

  useEffect(() => {
    setLoad(true);
    api.get(`matches/${id}/`)
      .then((res) => {
        setM(res.data);
        const fromDetail = normalizeLineupsResponse(res.data?.lineups);
        if (fromDetail.length) setLineups(fromDetail);
      })
      .catch((e) => setError(e.message || "Erreur"))
      .finally(() => setLoad(false));
  }, [id]);

  useEffect(() => {
    if (!m) return;
    const d = deriveLineupsFromMatch(m);
    setDerived(d);
    if (!lineups.length && d.items.length) setLineups(d.items);

    api.get(`matches/${id}/team-info/`)
      .then((res) => {
        const h = res.data?.home || {};
        const a = res.data?.away || {};
        setTeamInfo({
          home: { formation: h.formation || null, coach_name: h.coach_name || null },
          away: { formation: a.formation || null, coach_name: a.coach_name || null },
        });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [m, id]);

  const status = (m?.status || "").toUpperCase();
  const isLiveLike = status === "LIVE" || status === "HT" || status === "PAUSED";
  const isScheduled = status === "SCHEDULED" || status === "NOT_STARTED";
  const isLive = status === "LIVE";

  const { minute, isSecondHalf } = useLiveClock(m?.id, status, m?.minute);
  const minuteLabel = formatMinuteForBadge(status, minute, isSecondHalf);

  useEffect(() => {
    if (!isLiveLike) return;
    const t = setInterval(() => {
      api.get(`matches/${id}/`).then((res) => {
        setM(res.data);
        const fromDetail = normalizeLineupsResponse(res.data?.lineups);
        if (fromDetail.length) setLineups(fromDetail);
      }).catch(() => {});
    }, 8000);
    return () => clearInterval(t);
  }, [id, isLiveLike]);

  const loadLineupsFresh = async () => {
    setLoadingCompo(true);
    try {
      const res = await api.get(`matches/${id}/lineups/`);
      let items = normalizeLineupsResponse(res.data);
      if (!items.length) {
        const alt = await api.get(`matches/admin/lineups/api/`, { params: { action: "list", match_id: id } });
        items = normalizeQuickAdminToFlat(alt.data, id);
      }
      if (items.length) setLineups(items);

      const ti = await api.get(`matches/${id}/team-info/`);
      const h = ti.data?.home || {};
      const a = ti.data?.away || {};
      setTeamInfo({
        home: { formation: h.formation || null, coach_name: h.coach_name || null },
        away: { formation: a.formation || null, coach_name: a.coach_name || null },
      });
    } catch {}
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

  const homeStarters = (lineups || []).filter(p => clubEq(p, m?.home_club) && isStarting(p));
  const homeSubs     = (lineups || []).filter(p => clubEq(p, m?.home_club) && !isStarting(p));
  const awayStarters = (lineups || []).filter(p => clubEq(p, m?.away_club) && isStarting(p));
  const awaySubs     = (lineups || []).filter(p => clubEq(p, m?.away_club) && !isStarting(p));

  const globalMotmId = useMemo(() => {
    const starters = [...homeStarters, ...awayStarters];
    let best = null, bestVal = -1;
    starters.forEach(p => {
      const n = getRating(p);
      if (n != null && n > bestVal) { bestVal = n; best = p; }
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

  /* ---------- Helpers timeline ---------- */
  const _truthy = (v) =>
    v === true || v === 1 || v === "1" ||
    (typeof v === "string" && ["true","yes","y"].includes(v.toLowerCase()));
  const goalTag = (g = {}) => {
    const t = (g.type || g.kind || "").toString().toUpperCase();
    const isPen = _truthy(g.penalty) || _truthy(g.is_penalty) || _truthy(g.on_penalty) || ["PEN","P","PK","PENALTY"].includes(t);
    const isOG  = _truthy(g.own_goal) || _truthy(g.is_own_goal) || _truthy(g.og) || ["OG","CSC","OWN_GOAL","OWNGOAL"].includes(t);
    return isPen ? " (pen.)" : isOG ? " (csc)" : "";
  };
  const playerLabelEv = (ev = {}) => {
    if (ev.player_name) return ev.player_name;
    if (typeof ev.player === "number") return `Joueur #${ev.player}`;
    const first = ev?.player?.first_name || ev.player_first_name || "";
    const last  = ev?.player?.last_name  || ev.player_last_name  || "";
    const full = `${first} ${last}`.trim();
    return full || "Inconnu";
  };
  const assistLabel = (ev = {}) => {
    const txt =
      ev.assist_name ||
      ev.assist ||
      ev.assist_player_name ||
      (ev.assist && ev.assist.first_name ? `${ev.assist.first_name} ${ev.assist.last_name || ""}`.trim() : null);
    return (txt || "").trim() || null;
  };
  const cardEmoji = (ev) => {
    const v = (ev?.color ?? ev?.type ?? ev?.card ?? ev?.card_type ?? "").toString().toUpperCase();
    if (v === "R" || v.includes("RED") || v.includes("ROUGE")) return "🟥";
    if (v === "Y" || v.includes("YELLOW") || v.includes("JAUNE")) return "🟨";
    return "🟨";
  };
  const cardLabel = (ev) => {
    const v = (ev?.color ?? ev?.type ?? ev?.card ?? ev?.card_type ?? "").toString().toUpperCase();
    if (v === "R" || v.includes("RED") || v.includes("ROUGE")) return "Carton rouge";
    if (v === "Y" || v.includes("YELLOW") || v.includes("JAUNE")) return "Carton jaune";
    return "Carton";
  };

  const timeline = useMemo(() => {
    if (!m) return [];
    const homeId = Number(m.home_club);
    const goals = (m.goals || []).map((g) => ({ kind: "goal", minute: g.minute ?? g.time ?? g.min ?? null, club: Number(g.club ?? g.club_id), raw: g, onHomeSide: Number(g.club ?? g.club_id) === homeId }));
    const cards = (m.cards || []).map((c) => ({ kind: "card", minute: c.minute ?? c.time ?? c.min ?? null, club: Number(c.club ?? c.club_id), raw: c, onHomeSide: Number(c.club ?? c.club_id) === homeId }));
    return [...goals, ...cards].sort((a, b) => (a.minute ?? 0) - (b.minute ?? 0));
  }, [m]);

  const eventStats = useMemo(() => buildEventStats(m || {}), [m]);

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="text-red-600">Erreur : {error}</p>;
  if (!m) return <p>Match introuvable.</p>;

  return (
    <div className="mx-auto max-w-[480px] px-3 pb-[calc(20px+env(safe-area-inset-bottom))]">
      <section className="space-y-6">
        {/* En-tête */}
        <div className="relative bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4">
          <div className={`absolute right-3 top-3 z-[10] text-xs px-2 py-1 rounded-full ${statusClasses(status)} pointer-events-none`}>
            {isLive && <span className="mr-1 inline-block w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
            {statusLabel(status)}{minuteLabel ? ` • ${minuteLabel}` : ""}
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Logo src={m.home_club_logo} alt={m.home_club_name} />
              <span className="font-semibold text-[15px] leading-tight max-w-[7.5rem] sm:max-w-none break-words">
                {m.home_club_name}
              </span>
            </div>

            <div className="text-center">
              <div className="text-3xl font-extrabold leading-none">
                {isScheduled ? "vs" : (<>{m.home_score}<span className="text-gray-400"> - </span>{m.away_score}</>)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {fmtDate(m.datetime)}{m.venue ? ` • ${m.venue}` : ""}
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end min-w-0">
              <span className="font-semibold text-[15px] leading-tight text-right max-w-[7.5rem] sm:max-w-none break-words">
                {m.away_club_name}
              </span>
              <Logo src={m.away_club_logo} alt={m.away_club_name} />
            </div>
          </div>
        </div>

        {/* Onglets sticky */}
        <div className="sticky top-[calc(env(safe-area-inset-top)+0px)] z-[60] isolate bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <div className="px-0">
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
                    className={`relative -mb-px py-3 text-sm font-semibold tracking-wide transition
                      ${isActive ? "text-emerald-700" : "text-gray-600 hover:text-gray-900"}`}
                  >
                    {label}
                    <span className={`absolute left-0 -bottom-[1px] h-[2px] w-full ${isActive ? "bg-emerald-600" : "bg-transparent"}`} />
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
              <h2 id="events-panel" className="text-lg font-semibold mb-3">Événements</h2>
              {!timeline.length && <p className="text-gray-500">Aucun événement pour le moment.</p>}
              <div className="divide-y">
                {timeline.map((ev, idx) => {
                  const min = ev.minute ?? "?";

                  if (ev.kind === "goal") {
                    const g = ev.raw;
                    const pFull  = playerLabelEv(g);
                    const aFull  = assistLabel(g);
                    const pPhoto = playerPhoto(g);
                    const pId    = getEventPlayerId(g);

                    const LeftBlock = (
                      <>
                        <span className="text-sm text-gray-500">{min}'</span>
                        <TinyAvatar src={pPhoto} alt={pFull} size={32} onClick={pId ? () => openSheet(pId) : undefined} />
                        <div className="min-w-0 leading-tight">
                          {/* Buteur — nom complet (petit sur mobile) */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium text-[13px] sm:text-base whitespace-normal">
                              {pFull}{goalTag(g)}
                            </span>
                            <BallIcon />
                          </div>
                          {/* Passeur — ligne 2, petit texte */}
                          {aFull && (
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                              <span>&nbsp;:</span>
                              <span className="whitespace-normal">{aFull}</span>
                              <AssistIconImg />
                            </div>
                          )}
                        </div>
                      </>
                    );

                    const RightBlock = (
                      <>
                        <span className="text-sm text-gray-500">{min}'</span>
                        <TinyAvatar src={pPhoto} alt={pFull} size={32} onClick={pId ? () => openSheet(pId) : undefined} />
                        <div className="min-w-0 leading-tight text-right">
                          <div className="flex items-center gap-2 justify-end min-w-0">
                            <span className="font-medium text-[13px] sm:text-base whitespace-normal">
                              {pFull}{goalTag(g)}
                            </span>
                            <BallIcon />
                          </div>
                          {aFull && (
                            <div className="flex items-center gap-1 justify-end text-[11px] text-gray-500 mt-0.5">
                              <span>Passe&nbsp;:</span>
                              <span className="whitespace-normal">{aFull}</span>
                              <AssistIconImg />
                            </div>
                          )}
                        </div>
                      </>
                    );

                    return (
                      <Row
                        key={`g-${idx}-${min}`}
                        left={ev.onHomeSide ? LeftBlock : null}
                        center={<span></span>}
                        right={!ev.onHomeSide ? RightBlock : null}
                      />
                    );
                  }

                  // CARTON
                  const c = ev.raw;
                  const emoji  = cardEmoji(c);
                  const pFull  = c.player_name || "Inconnu";
                  const cPhoto = c.player_photo || null;
                  const pId    = getEventPlayerId(c);

                  const CardLeft = (
                    <>
                      <span className="text-sm text-gray-500">{min}'</span>
                      <span className="inline-flex items-center justify-center w-5 h-5 leading-none shrink-0">{emoji}</span>
                      <TinyAvatar src={cPhoto} alt={pFull} size={32} onClick={pId ? () => openSheet(pId) : undefined} />
                      <div className="min-w-0 leading-tight">
                        <div className="font-medium text-[13px] sm:text-base">{cardLabel(c)}</div>
                        <div className="text-[11px] text-gray-600">{pFull}</div>
                      </div>
                    </>
                  );

                  const CardRight = (
                    <>
                      <span className="text-sm text-gray-500">{min}'</span>
                      <span className="inline-flex items-center justify-center w-5 h-5 leading-none shrink-0">{emoji}</span>
                      <TinyAvatar src={cPhoto} alt={pFull} size={32} onClick={pId ? () => openSheet(pId) : undefined} />
                      <div className="min-w-0 leading-tight text-right">
                        <div className="font-medium text-[13px] sm:text-base">{cardLabel(c)}</div>
                        <div className="text-[11px] text-gray-600">{pFull}</div>
                      </div>
                    </>
                  );

                  return (
                    <Row
                      key={`c-${idx}-${min}`}
                      left={ev.onHomeSide ? CardLeft : null}
                      right={!ev.onHomeSide ? CardRight : null}
                    />
                  );
                })}
              </div>
            </div>
          </section>
        ) : (
          <section aria-labelledby="compos-panel">
            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 id="compos-panel" className="text-lg font-semibold">Compositions</h2>
                <button
                  type="button"
                  onClick={loadLineupsFresh}
                  className="text-sm px-3 py-1.5 rounded-md border border-gray-200 hover:bg-gray-50"
                  disabled={loadingCompo}
                >
                  {loadingCompo ? "Chargement..." : "Rafraîchir"}
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
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
                />
              </div>
            </div>

            <div className="flex items-center justify-between mt-6">
              <Link to={`/`} className="text-blue-600 hover:underline">← Accueil</Link>
              <button className="text-sm text-gray-600 hover:underline" onClick={() => navigate(-1)}>Retour</button>
            </div>
          </section>
        )}
      </section>
    </div>
  );
}
