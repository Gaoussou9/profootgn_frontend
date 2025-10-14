// src/pages/AssistsLeaders.jsx
import { useEffect, useState } from "react";
import api from "../api/client";
import { usePlayerSheet } from "../components/PlayerSheet";

// Absolutise un chemin media
function absUrlMaybe(u) {
  if (!u) return null;
  try { return new URL(u).href; } catch { /* relative */ }
  if (u.startsWith("/")) return `${window.location.origin}${u}`;
  if (u.startsWith("media/")) return `${window.location.origin}/${u}`;
  return u;
}

/* ---------- Pick d’identité du passeur depuis /api/goals/ ---------- */
function pickAssistIdentity(g) {
  const id =
    g.assist_player ??
    g.assist_player_id ??
    g.assist?.id ??
    null;

  const name =
    g.assist_name ||
    g.assist_player_name ||
    g.assist?.name ||
    [g.assist?.first_name, g.assist?.last_name].filter(Boolean).join(" ").trim() ||
    "";

  let photo =
    g.assist_player_photo ||
    g.assist_photo ||
    g.assist_avatar ||
    g.assist_image ||
    g.assist?.photo ||
    g.assist?.avatar ||
    g.assist?.image ||
    g.assist?.image_url ||
    null;

  const clubId   = g.assist_club ?? g.assist?.club ?? g.club ?? g.club_id ?? null;
  const clubName = g.assist_club_name || g.assist?.club_name || g.club_name || null;
  const clubLogo =
    g.assist_club_logo || g.assist?.club_logo || g.club_logo || null;

  if (!id && !name) return null;

  return {
    key: id != null ? `id:${id}` : `name:${String(name).toLowerCase()}`,
    id: id ?? null,
    name: name || "Inconnu",
    photo: absUrlMaybe(photo),
    clubId: clubId ?? null,
    clubName: clubName || null,
    clubLogo: absUrlMaybe(clubLogo),
  };
}

/* ----- Admin: récupérer la liste des joueurs d’un club (avec photos) ----- */
async function fetchClubPlayers(clubId) {
  if (!clubId) return [];
  const url = `/admin/clubs/${clubId}/players/`;
  try {
    const r = await api.get(url);
    const arr = Array.isArray(r.data?.players) ? r.data.players : [];
    return arr.map(p => ({
      id: p.id,
      name:
        p.name ||
        [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
        `Joueur #${p.id}`,
      first_name: p.first_name || "",
      last_name:  p.last_name  || "",
      photo: absUrlMaybe(p.photo || p.avatar || p.image || p.image_url || null),
    }));
  } catch {
    return [];
  }
}

/* Cherche le joueur par nom “souple” dans la liste d’un club */
function findPlayerByName(players, targetName) {
  if (!players?.length || !targetName) return null;
  const t = String(targetName).trim().toLowerCase();

  // 1) match exact sur name (complet)
  let hit = players.find(p => String(p.name).trim().toLowerCase() === t);
  if (hit) return hit;

  // 2) match sur nom de famille
  const parts = t.split(/\s+/).filter(Boolean);
  const last = parts.at(-1);
  if (last) {
    hit = players.find(p => String(p.last_name).trim().toLowerCase() === last);
    if (hit) return hit;
  }
  return null;
}

export default function AssistsLeaders() {
  const { openSheet } = usePlayerSheet();

  const [rows, setRows] = useState([]);
  const [loading, setLoad] = useState(true);
  const [error, setErr] = useState(null);

  useEffect(() => {
    let stop = false;

    async function load() {
      setLoad(true);
      setErr(null);
      try {
        // 1) Récupère tous les buts
        const r = await api.get("goals/", { params: { page_size: 5000 } });
        const list = Array.isArray(r.data?.results) ? r.data.results
                  : Array.isArray(r.data) ? r.data
                  : [];

        // 2) Agrégation par passeur
        const map = new Map();
        for (const g of list) {
          const a = pickAssistIdentity(g);
          if (!a) continue;
          const prev = map.get(a.key);
          if (prev) {
            prev.assists += 1;
            prev.photo ??= a.photo;
            prev.clubId ??= a.clubId;
            prev.clubName ??= a.clubName;
            prev.clubLogo ??= a.clubLogo;
            prev.playerId ??= a.id ?? null;
          } else {
            map.set(a.key, {
              key: a.key,
              playerId: a.id ?? null,
              playerName: a.name || "Inconnu",
              photo: a.photo || null,
              clubId: a.clubId,
              clubName: a.clubName,
              clubLogo: a.clubLogo || null,
              assists: 1,
            });
          }
        }

        let arr = Array.from(map.values());

        // 3) Enrichissement via /admin/clubs/{id}/players/ (photos ET id manquant)
        const clubsToFetch = new Set(
          arr.filter(x => (x.clubId && (!x.photo || !x.playerId))).map(x => x.clubId)
        );

        const clubPlayers = {};
        await Promise.all(
          Array.from(clubsToFetch).map(async (cid) => {
            clubPlayers[cid] = await fetchClubPlayers(cid);
          })
        );

        arr = arr.map(x => {
          if (x.clubId && clubPlayers[x.clubId]?.length) {
            const hit = findPlayerByName(clubPlayers[x.clubId], x.playerName);
            if (hit) {
              return {
                ...x,
                playerId: x.playerId ?? hit.id ?? null,
                photo: x.photo ?? hit.photo ?? null,
              };
            }
          }
          return x;
        });

        // 4) Tri final
        arr.sort((a, b) => {
          if (b.assists !== a.assists) return b.assists - a.assists;
          return (a.playerName || "").localeCompare(b.playerName || "");
        });

        if (!stop) setRows(arr);
      } catch (e) {
        if (!stop) setErr(e?.message || "Impossible de charger le classement des passeurs.");
      } finally {
        if (!stop) setLoad(false);
      }
    }

    load();
    return () => { stop = true; };
  }, []);

  return (
    <section className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100 p-4">
        <h1 className="text-lg font-semibold">Classement des passeurs</h1>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 rounded-xl px-4 py-3">{error}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600 border-b">
              <th className="px-4 py-2 w-14">#</th>
              <th className="px-4 py-2">Joueur</th>
              <th className="px-4 py-2 text-right w-24">Passes D.</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-3 text-gray-500" colSpan={3}>Chargement…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-4 py-3 text-gray-500" colSpan={3}>Aucune passe décisive trouvée.</td></tr>
            ) : (
              rows.map((r, i) => {
                const imgSrc = r.photo || r.clubLogo || "/player-placeholder.png";
                const clickable = !!r.playerId;
                const onClick = clickable ? () => openSheet(r.playerId) : undefined;

                return (
                  <tr key={r.key} className="border-t">
                    <td className="px-4 py-2 text-gray-500 tabular-nums">{i + 1}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-3">
                        <img
                          src={imgSrc}
                          alt={r.playerName}
                          className={`w-8 h-8 rounded-full object-cover ring-1 ring-gray-200 ${clickable ? "cursor-pointer" : ""}`}
                          onError={(e)=>{ e.currentTarget.src="/player-placeholder.png"; }}
                          onClick={onClick}
                          role={clickable ? "button" : undefined}
                          tabIndex={clickable ? 0 : undefined}
                          onKeyDown={clickable ? (e) => { if (e.key === "Enter" || e.key === " ") onClick(); } : undefined}
                          title={clickable ? `Voir la fiche de ${r.playerName}` : r.playerName}
                        />
                        <div className="min-w-0">
                          <div className="font-medium truncate">{r.playerName}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {r.clubName || "—"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-right font-semibold tabular-nums">
                      {r.assists}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
