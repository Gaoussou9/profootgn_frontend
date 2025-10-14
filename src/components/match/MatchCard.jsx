import { Link } from "react-router-dom";

const Badge = ({type, children})=>{
  const m = {
    LIVE: "bg-red-100 text-red-700 ring-red-200",
    HT: "bg-amber-100 text-amber-800 ring-amber-200",
    SCHEDULED: "bg-blue-100 text-blue-700 ring-blue-200",
    FT: "bg-emerald-100 text-emerald-700 ring-emerald-200",
    FINAL: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  }[(type||"").toUpperCase()];
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full ring-1 ${m||"bg-slate-100 text-slate-700 ring-slate-200"}`}>{children}</span>;
};

const Logo = ({src, alt, size="w-7 h-7 sm:w-9 sm:h-9"})=>(
  <img
    src={src || "/club-placeholder.png"}
    alt={alt||"Logo"}
    className={`${size} object-contain bg-white rounded-md ring-1 ring-slate-200`}
    onError={(e)=>{ e.currentTarget.src="/club-placeholder.png"; }}
  />
);

export default function MatchCard({
  id, roundName, kickoffISO,
  homeName, homeLogo, awayName, awayLogo,
  homeScore, awayScore, status, liveMinute
}){
  const statusLabel = (status||"").toUpperCase() === "LIVE"
    ? `LIVE • ${liveMinute??"•"}’`
    : (status || "—");

  return (
    <Link to={`/match/${id}`} className="block card p-3 sm:p-4 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
        <span className="font-medium">{roundName || "Journée"}</span>
        <Badge type={status}>{statusLabel}</Badge>
      </div>

      {/* Corps: layout mobile-first */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-3">
        {/* Home */}
        <div className="flex items-center gap-2 min-w-0">
          <Logo src={homeLogo} alt={homeName}/>
          <span className="truncate text-sm sm:text-base font-medium">{homeName}</span>
        </div>

        {/* Score */}
        <div className="justify-self-center text-center">
          <span className="text-base sm:text-lg font-semibold tabular-nums">{homeScore ?? 0}</span>
          <span className="mx-1 text-slate-400">–</span>
          <span className="text-base sm:text-lg font-semibold tabular-nums">{awayScore ?? 0}</span>
        </div>

        {/* Away */}
        <div className="flex items-center justify-end gap-2 min-w-0">
          <span className="truncate text-sm sm:text-base font-medium text-right">{awayName}</span>
          <Logo src={awayLogo} alt={awayName}/>
        </div>
      </div>

      {/* Footer: date (masquée sur très petit écran si tu veux) */}
      {kickoffISO && (
        <div className="mt-2 text-xs text-slate-500">
          {new Date(kickoffISO).toLocaleString()}
        </div>
      )}
    </Link>
  );
}
