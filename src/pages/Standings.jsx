// src/pages/Standings.jsx
import { useEffect, useRef, useState } from "react";
import api from "../api/client";

export default function Standings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoad] = useState(true);
  const [error, setError] = useState(null);
  const [liveSet, setLiveSet] = useState(new Set());
  const [logoMap, setLogoMap] = useState(new Map());
  const prevRef = useRef(new Map());

  // Charger les logos (une seule fois)
  useEffect(() => {
    (async () => {
      try {
        const r = await api.get("clubs/?page_size=500");
        const arr = Array.isArray(r.data) ? r.data : r.data.results || [];
        const m = new Map(arr.map((c) => [c.id, c.logo_url || c.logo || c.image || null]));
        setLogoMap(m);
      } catch {
        setLogoMap(new Map());
      }
    })();
  }, []);

  // Récup standings + live
  const fetchData = async () => {
    try {
      const [stRes, liveRes] = await Promise.all([
        api.get("stats/standings/?include_live=1"),
        api.get("matches/live/"),
      ]);

      const parseStandings = (data) => {
        if (Array.isArray(data)) return data;
        if (data && Array.isArray(data.table)) return data.table;
        if (data && Array.isArray(data.results)) return data.results;
        return [];
      };

      const st = parseStandings(stRes.data);

      const liveMatches = Array.isArray(liveRes.data)
        ? liveRes.data
        : liveRes.data?.results || [];

      const liveIds = new Set(
        liveMatches.flatMap((m) => [m.home_club, m.away_club]).filter(Boolean)
      );

      // marquer les lignes qui changent
      const prev = prevRef.current;
      const enriched = st.map((r) => {
        const p = prev.get(r.club_id);
        const changed = p
          ? p.points !== r.points ||
            p.goal_diff !== r.goal_diff ||
            p.goals_for !== r.goals_for ||
            p.played !== r.played
          : false;
        return { ...r, _changed: changed };
      });
      prevRef.current = new Map(enriched.map((r) => [r.club_id, r]));

      setRows(enriched);
      setLiveSet(liveIds);
      setError(null);
    } catch (e) {
      setError(e.message || "Erreur de chargement");
    } finally {
      setLoad(false);
    }
  };

  useEffect(() => {
  let interval = null;

  const init = async () => {
    await fetchData();

    try {
      const r = await api.get("matches/live/");
      const liveMatches = Array.isArray(r.data)
        ? r.data
        : r.data?.results || [];

      if (liveMatches.length > 0) {
        interval = setInterval(fetchData, 60000); // 🔥 1 minute seulement si LIVE
      }
    } catch {}
  };

  init();

  return () => {
    if (interval) clearInterval(interval);
  };
}, []);

  if (loading) return <p>Chargement…</p>;
  if (error) return <p className="text-red-600">Erreur : {error}</p>;

  const lastIdx = Math.max(0, rows.length - 1);

  return (
    <section className="mx-auto max-w-4xl px-3 pb-20">
      <h1 className="text-2xl font-bold mb-4">Classement</h1>

      {/* ==== Mobile (Android/iOS) ==== */}
      {/* Barre d'entête alignée sur les colonnes MJ / Diff / Pts */}
      <div className="sm:hidden flex items-center justify-between px-3 py-1 text-[11px] uppercase text-slate-500">
        {/* Espace réservé à la partie gauche (rang + logo + nom) */}
        <span className="sr-only">Rang, club</span>
        <div className="flex-1" />
        {/* En-têtes à droite, largeurs = valeurs plus bas */}
        <div className="flex items-center gap-3 tabular-nums">
          <span className="w-4 text-center">MJ</span>
          <span className="w-7 text-center">Diff</span>
          <span className="w-6 text-center">Pts</span>
        </div>
      </div>

      <ul className="grid gap-2 sm:hidden">
        {rows.map((r, i) => {
          const live = liveSet.has(r.club_id);
          const logoSrc = r.club_logo || logoMap.get(r.club_id) || "/club-placeholder.png";

          const isTop2 = i < 2;
          const isBottom2 = i >= lastIdx - 1;
          const ring = isTop2
            ? "ring-emerald-300 bg-emerald-50"
            : isBottom2
            ? "ring-rose-300 bg-rose-50"
            : "ring-blue-200 bg-white";

          const diff = r.goal_diff ?? (r.goals_for ?? 0) - (r.goals_against ?? 0);

          return (
            <li
              key={r.club_id}
              className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl ring-1 ${ring}`}
            >
              {/* Rang + logo + nom */}
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold w-5 text-gray-500 text-right">
                  {i + 1}
                </span>
                <img
                  src={logoSrc}
                  alt={r.club_name}
                  className="w-6 h-6 object-contain shrink-0"
                  onError={(e) => (e.currentTarget.src = "/club-placeholder.png")}
                />
                <span className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                  {r.club_name}
                </span>
                {live && (
                  <span className="ml-1 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    LIVE
                  </span>
                )}
              </div>

              {/* Stats compactes (MJ / Diff / Pts) */}
              <div className="flex items-center gap-3 text-[12px] tabular-nums">
                <span className="w-4 text-center text-gray-600" aria-label="Matchs joués">
                  {r.played}
                </span>
                <span
                  className={`w-7 text-center font-semibold ${diff < 0 ? "text-red-600" : "text-gray-800"}`}
                  aria-label="Différence de buts"
                >
                  {diff}
                </span>
                <span className="w-6 text-center font-bold text-gray-900" aria-label="Points">
                  {r.points}
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      {/* ==== sm+ : tableau complet ==== */}
      <div className="hidden sm:block overflow-x-auto rounded-2xl ring-1 ring-gray-200 shadow-sm bg-white">
        <table className="min-w-full bg-white border-separate border-spacing-y-2">
          <thead className="bg-gray-50 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-3 py-2 text-left">#</th>
              <th className="px-3 py-2 text-left">Club</th>
              <th className="px-3 py-2 text-center">MJ</th>
              <th className="px-3 py-2 text-center">V</th>
              <th className="px-3 py-2 text-center">N</th>
              <th className="px-3 py-2 text-center">D</th>
              <th className="px-3 py-2 text-center">BM</th>
              <th className="px-3 py-2 text-center">BC</th>
              <th className="px-3 py-2 text-center">Diff</th>
              <th className="px-3 py-2 text-center">Pts</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {rows.map((r, i) => {
              const live = liveSet.has(r.club_id);
              const logoSrc = r.club_logo || logoMap.get(r.club_id) || "/club-placeholder.png";

              const isTop2 = i < 2;
              const isBottom2 = i >= lastIdx - 1;
              const ring =
                isTop2
                  ? "ring-emerald-300 bg-emerald-50"
                  : isBottom2
                  ? "ring-rose-300 bg-rose-50"
                  : "ring-blue-200 bg-white";

              const diff =
                r.goal_diff ?? (r.goals_for ?? 0) - (r.goals_against ?? 0);

              return (
                <tr key={r.club_id} className={`rounded-lg ring-1 ${ring}`}>
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={logoSrc}
                        alt={r.club_name}
                        className="w-5 h-5 object-contain"
                        onError={(e) => (e.currentTarget.src = "/club-placeholder.png")}
                      />
                      <span className="truncate">{r.club_name}</span>
                      {live && (
                        <span className="ml-1 inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                          <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                          LIVE
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center tabular-nums">{r.played}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{r.wins}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{r.draws}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{r.losses}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{r.goals_for}</td>
                  <td className="px-3 py-2 text-center tabular-nums">{r.goals_against}</td>
                  <td className={`px-3 py-2 text-center tabular-nums ${diff < 0 ? "text-red-600" : ""}`}>{diff}</td>
                  <td className="px-3 py-2 text-center font-bold tabular-nums">{r.points}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 mt-3">
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded ring-2 ring-emerald-400 bg-emerald-50" />
          Play-Off LdC CAF
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded ring-2 ring-rose-400 bg-rose-50" />
          Relégation
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded ring-1 ring-blue-200 bg-white" />
          Maintien
        </span>
      </div>
    </section>
  );
}
