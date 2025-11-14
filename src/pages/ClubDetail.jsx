// src/pages/ClubDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import { usePlayerSheet } from "../components/PlayerSheet"; // ✅ fiche joueur
import { useStaffSheet } from "../components/StaffSheet";   // ✅ fiche staff

/* ---------- Réglage taille icônes de l’entête ---------- */
const ICON_SIZE = 50;

/* ---------- UI helpers ---------- */
const ClubLogo = ({ src, alt }) => (
  <img
    src={src || "/club-placeholder.png"}
    alt={alt}
    className="w-14 h-14 rounded-md object-contain ring-1 ring-black/10 bg-white"
    onError={(e) => (e.currentTarget.src = "/club-placeholder.png")}
  />
);

const Avatar = ({ src, alt, onClick }) => (
  <img
    src={src || "/player-placeholder.png"}
    alt={alt}
    className={`w-10 h-10 rounded-full object-cover ring-1 ring-black/10 bg-white ${
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
    title={onClick ? `Voir la fiche de ${alt || "ce membre"}` : alt}
  />
);

/* ---------- Icône Assist (crampon) ---------- */
const ASSIST_ICON_SRC = "/icons/cleat_20.png";
const AssistIcon = ({ size = ICON_SIZE }) => (
  <img
    src={ASSIST_ICON_SRC}
    alt="Assist"
    width={size}
    height={size}
    className="inline-block align-middle object-contain"
    onError={(e) => {
      e.currentTarget.outerHTML = "👟";
    }}
  />
);

/* Petit wrapper pour aligner toutes les icônes de l’entête au même gabarit */
const HeaderIcon = ({ children }) => (
  <span
    className="inline-flex items-center justify-center"
    style={{ width: ICON_SIZE, height: ICON_SIZE, lineHeight: 1 }}
  >
    {children}
  </span>
);

/* ---------- Helpers stat / poste ---------- */
function normalizePos(val) {
  return String(val || "").trim().toUpperCase();
}
function positionCategory(p) {
  const s = normalizePos(p?.position || p?.role);
  if (/^(GK|G|GOAL|GARDIEN)/.test(s)) return "Gardiens";
  if (/(^|[^A-Z])(DEF|DF|DC|DL|DR|CB|LB|RB)([^A-Z]|$)/.test(s)) return "Défenseurs";
  if (/(MIL|MID|MC|MDC|MOC|MD|MG|ML|CM|CDM|CAM|DM|AM)([^A-Z]|$)/.test(s)) return "Milieux";
  if (/(ATT|AT|FWD|FW|ST|BU|AV|WINGER|AILIER)/.test(s)) return "Attaquants";
  return "Autres";
}

const stat = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
    }
  return "0";
};

/* ---------- assist extraction (recyclé de AssistsLeaders) ---------- */
function pickAssistIdentityFromGoal(g) {
  const id =
    g.assist_player ??
    g.assist_player_id ??
    g.assist?.id ??
    null;

  const name =
    g.assist_name ||
    g.assist_player_name ||
    g.assist?.name ||
    [g.assist?.first_name, g.assist?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "";

  if (!id && !name) return null;

  return {
    playerId: id ?? null,
    playerName: name || "Inconnu",
  };
}

/* ================================================================== */

export default function ClubDetail() {
  const { id } = useParams();
  const { openSheet } = usePlayerSheet();                // ✅ joueurs
  const { openSheet: openStaffSheet } = useStaffSheet(); // ✅ staff

  const [club, setClub] = useState(null);
  const [players, setPlayers] = useState([]);
  const [staff, setStaff] = useState([]);

  // totals[playerId] = { goals, assists, yellows, reds } à partir de /players-stats
  const [totals, setTotals] = useState({});
  // assistTotals[playerId] = nombre de passes décisives recalculé depuis /goals/
  const [assistTotals, setAssistTotals] = useState({});

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  /* ---------- Charge club + joueurs + staff ---------- */
  useEffect(() => {
    let stop = false;

    async function run() {
      setLoading(true);
      setErr(null);
      try {
        // Club
        const { data: c } = await api.get(`clubs/${id}/`);
        if (stop) return;
        setClub(c);

        // Joueurs — follow pagination if present
try {
  const fetchAll = async (path, params = {}) => {
    const accumulated = [];
    // première requête
    let res = await api.get(path, { params });
    let data = res.data;

    // cas DRF / pagination { results, next }
    if (Array.isArray(data?.results) || data?.next !== undefined) {
      // push first page results
      const first = Array.isArray(data.results) ? data.results : data;
      if (Array.isArray(first)) accumulated.push(...first);

      // suivant: utilise data.next (URL) si présent
      let next = data.next || null;
      while (next) {
        // si next est une URL absolue, on peut appeler api.get(next) si client le supporte
        // fallback: extraire query params + appeler même endpoint avec page param
        try {
          const r = await api.get(next);
          const d = r.data;
          const pageArr = Array.isArray(d.results) ? d.results : d;
          if (Array.isArray(pageArr)) accumulated.push(...pageArr);
          next = d.next || null;
        } catch {
          // si appel via next échoue, on casse la boucle pour éviter boucle infinie
          next = null;
        }
      }
    } else if (Array.isArray(data)) {
      // si l'API renvoie déjà un tableau (sans pagination)
      accumulated.push(...data);
    } else {
      // parfois l'API met les résultats directement dans data.results
      const maybe = Array.isArray(data?.data) ? data.data : Array.isArray(data?.results) ? data.results : [];
      if (maybe.length) accumulated.push(...maybe);
    }

    return accumulated;
  };

  const arr = await fetchAll(`players/?club=${id}`, { active: 1, ordering: "number", page_size: 1000 });
  if (!stop && Array.isArray(arr)) setPlayers(arr);
} catch {
  // fallback simple
  try {
    const r2 = await api.get(`players/?club=${id}&ordering=number&page_size=1000`);
    const arr2 = Array.isArray(r2.data) ? r2.data : r2.data?.results || [];
    if (!stop && Array.isArray(arr2)) setPlayers(arr2);
  } catch {
    if (!stop) setPlayers([]);
  }
}


        // Staff
        try {
          const r = await api.get(
            `staff/?club=${id}&active=1&ordering=full_name`
          );
          const sArr = Array.isArray(r.data) ? r.data : r.data?.results || [];
          if (!stop) setStaff(Array.isArray(sArr) ? sArr : []);
        } catch {
          if (!stop) setStaff([]);
        }
      } catch (e) {
        if (!stop) setErr(e?.message || "Erreur de chargement");
      } finally {
        if (!stop) setLoading(false);
      }
    }

    run();
    return () => {
      stop = true;
    };
  }, [id]);

  /* ---------- Charge les totaux club (buts, cartons, etc.) ---------- */
  useEffect(() => {
    let stop = false;
    let timer;

    const fetchTotals = async () => {
      try {
        const r = await api.get(`clubs/${id}/players-stats/?include_live=1`);
        const arr = Array.isArray(r.data?.players) ? r.data.players : [];

        const map = {};
        arr.forEach((p) => {
          if (p?.id != null) {
            map[p.id] = {
              goals: Number(
                p.goals ??
                  p.buts ??
                  p.goals_total ??
                  0
              ),
              assists: Number(
                p.assists ??
                  p.assist ??
                  p.passes_decisives ??
                  p.passes_decisive ??
                  p.a ??
                  p.assists_total ??
                  0
              ),
              yellows: Number(
                p.yc ??
                  p.yellow_cards ??
                  p.jaunes ??
                  0
              ),
              reds: Number(
                p.rc ??
                  p.red_cards ??
                  p.rouges ??
                  0
              ),
            };
          }
        });

        if (!stop) setTotals(map);
      } catch {
        if (!stop) setTotals({});
      }
    };

    fetchTotals();
    timer = setInterval(fetchTotals, 12000);

    const onVis = () => {
      if (document.visibilityState === "visible") fetchTotals();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stop = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [id]);

  /* ---------- Recalcule les passes décisives depuis /goals/ ---------- */
  useEffect(() => {
    let stop = false;

    async function loadAssistsFromGoals() {
      try {
        const r = await api.get("goals/", { params: { page_size: 5000 } });
        const rawGoals = Array.isArray(r.data?.results)
          ? r.data.results
          : Array.isArray(r.data)
          ? r.data
          : [];

        const counts = {}; // { playerId: totalAssists }

        for (const g of rawGoals) {
          // club du passeur
          const assistClubId =
            g.assist_club ??
            g.assist?.club ??
            g.club ??
            g.club_id ??
            null;

          // club du buteur (fallback si assist_club est manquant)
          const goalClubId =
            g.club_id ??
            g.club ??
            g.club_scored_for ??
            g.home_club ??
            g.away_club ??
            null;

          // garder uniquement les passes qu'on peut associer à CE club
          const isSameClubByAssist =
            assistClubId != null &&
            String(assistClubId) === String(id);

          const isSameClubByGoalButFallback =
            (!assistClubId || assistClubId == null) &&
            goalClubId != null &&
            String(goalClubId) === String(id);

          if (!isSameClubByAssist && !isSameClubByGoalButFallback) {
            continue;
          }

          // identité du passeur
          const a = pickAssistIdentityFromGoal(g);
          if (!a) continue;
          if (a.playerId == null) continue; // pas d'id => on ne peut pas rattacher proprement

          counts[a.playerId] = (counts[a.playerId] || 0) + 1;
        }

        // 🔥 filtre de sécurité :
        // garder seulement les joueurs qui EXISTENT dans `players`
        // (donc pas de "fantômes" venus d'anciens joueurs)
        const playerIdsInClub = new Set(
          (players || []).map((p) => String(p.id))
        );
        const filteredCounts = {};
        Object.entries(counts).forEach(([pid, val]) => {
          if (playerIdsInClub.has(String(pid))) {
            filteredCounts[pid] = val;
          }
        });

        if (!stop) {
          setAssistTotals(filteredCounts);
        }
      } catch (e) {
        if (!stop) {
          setAssistTotals({});
        }
      }
    }

    loadAssistsFromGoals();
    return () => {
      stop = true;
    };
  }, [id, players]);

  /* ---------- Utils locaux ---------- */
  const playerName = (p) =>
    p?.name ||
    [p?.first_name, p?.last_name].filter(Boolean).join(" ") ||
    p?.full_name ||
    "—";

  // normalise le nom pour regrouper les doublons ("Alpha Amadou Diallo" vs "Alpha Amadou Diallo")
  function normName(p) {
    return playerName(p).trim().toLowerCase();
  }

  // score visuel pour choisir la meilleure fiche quand doublons
  function visualScore(p) {
    let score = 0;
    if (p.number && Number(p.number) !== 0) score += 4;
    if (
      p.photo ||
      p.player_photo ||
      p.avatar ||
      p.image ||
      p.image_url
    ) {
      score += 3;
    }
    if (p.position || p.role) score += 2;
    return score;
  }

  /* ---------- Regroupement par lignes (Gardiens / Déf / Milieux / etc.) ---------- */
  const grouped = useMemo(() => {
    const buckets = {
      Gardiens: [],
      Défenseurs: [],
      Milieux: [],
      Attaquants: [],
      Autres: [],
    };
    (players || []).forEach((p) => {
      buckets[positionCategory(p)].push(p);
    });
    return buckets;
  }, [players]);

  if (loading) return <p>Chargement…</p>;
  if (err) return <p className="text-red-600">Erreur : {err}</p>;
  if (!club) return <p>Club introuvable.</p>;

  /* ---------- TABLEAU JOUEURS (fusion des doublons par nom) ---------- */
  const SectionTable = ({ title, list }) => {
    if (!list.length) return null;

    // 1. grouper les joueurs par nom normalisé
    const byName = new Map();
    list.forEach((p) => {
      const key = normName(p);
      if (!byName.has(key)) {
        byName.set(key, [p]);
      } else {
        byName.get(key).push(p);
      }
    });

    // 2. pour chaque nom, choisir la meilleure fiche visuelle
    //    et fusionner leurs stats cumulées
    const mergedPlayers = [];
    for (const [, sameNamePlayers] of byName.entries()) {
      // choisir la fiche "officielle"
      let best = sameNamePlayers[0];
      for (const cand of sameNamePlayers.slice(1)) {
        if (visualScore(cand) > visualScore(best)) {
          best = cand;
        }
      }

      // cumul stats (buts, assists, cartons)
      let totalGoals = 0;
      let totalAssists = 0;
      let totalYC = 0;
      let totalRC = 0;

      sameNamePlayers.forEach((pl) => {
        const t = totals[pl.id] || {};
        const assistFromGoals = assistTotals[pl.id];

        const goalsVal = t.goals ?? stat(pl, ["goals", "g", "buts"]);
        const assistsVal =
          assistFromGoals ??
          t.assists ??
          stat(pl, ["assists", "assist", "a", "passes_decisives"]);
        const ycVal =
          t.yellows ?? stat(pl, ["yellow_cards", "yc", "cartons_jaunes"]);
        const rcVal =
          t.reds ?? stat(pl, ["red_cards", "rc", "cartons_rouges"]);

        totalGoals += Number(goalsVal || 0);
        totalAssists += Number(assistsVal || 0);
        totalYC += Number(ycVal || 0);
        totalRC += Number(rcVal || 0);
      });

      // on stocke tout ça dans l'objet best
      mergedPlayers.push({
        ...best,
        __mergedStats: {
          goals: totalGoals,
          assists: totalAssists,
          yellows: totalYC,
          reds: totalRC,
        },
      });
    }

    // 3. tri final par numéro puis nom
    mergedPlayers.sort((a, b) => {
      const na = Number.isFinite(Number(a.number)) ? Number(a.number) : 9999;
      const nb = Number.isFinite(Number(b.number)) ? Number(b.number) : 9999;
      if (na !== nb) return na - nb;
      return (playerName(a) || "").localeCompare(playerName(b) || "", "fr", {
        sensitivity: "base",
      });
    });

    return (
      <div className="rounded-2xl ring-1 ring-black/10 overflow-hidden bg-white">
        {/* Barre titre verte */}
        <div className="px-4 py-2 bg-emerald-700 text-white font-semibold">
          {title.toUpperCase()}
        </div>

        {/* scroll horizontal si écran étroit */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[650px]">
            <thead className="bg-gray-50">
              <tr className="text-gray-600">
                <th className="w-12 py-2 px-3 text-left">No</th>
                <th className="w-12 py-2 px-3 text-left">Photo</th>
                <th className="py-2 px-3 text-left">Nom</th>
                <th className="w-28 py-2 px-3 text-left">Poste</th>
                <th className="w-12 py-2 px-3 text-center">
                  <HeaderIcon>
                    <span className="text-[22px] leading-none">⚽</span>
                  </HeaderIcon>
                </th>
                <th className="w-12 py-2 px-3 text-center">
                  <HeaderIcon>
                    <AssistIcon />
                  </HeaderIcon>
                </th>
                <th className="w-12 py-2 px-3 text-center">
                  <HeaderIcon>
                    <span className="text-[22px] leading-none">🟨</span>
                  </HeaderIcon>
                </th>
                <th className="w-12 py-2 px-3 text-center">
                  <HeaderIcon>
                    <span className="text-[22px] leading-none">🟥</span>
                  </HeaderIcon>
                </th>
              </tr>
            </thead>
            <tbody>
              {mergedPlayers.map((p, idx) => {
                const merged = p.__mergedStats || {};
                const t = totals[p.id] || {};
                const assistFromGoals = assistTotals[p.id];

                const goals =
                  merged.goals ??
                  t.goals ??
                  stat(p, ["goals", "g", "buts"]);

                const assists =
                  merged.assists ??
                  assistFromGoals ??
                  t.assists ??
                  stat(p, ["assists", "assist", "a", "passes_decisives"]);

                const yc =
                  merged.yellows ??
                  t.yellows ??
                  stat(p, ["yellow_cards", "yc", "cartons_jaunes"]);

                const rc =
                  merged.reds ??
                  t.reds ??
                  stat(p, ["red_cards", "rc", "cartons_rouges"]);

                return (
                  <tr key={p.id ?? `${title}-${idx}`} className="border-t">
                    <td className="py-2 px-3 tabular-nums text-gray-600">
                      {p.number ?? idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      <Avatar
                        src={
                          p.photo ||
                          p.player_photo ||
                          p.avatar ||
                          p.image ||
                          p.image_url
                        }
                        alt={playerName(p)}
                        onClick={p.id ? () => openSheet(p.id) : undefined}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-medium leading-tight">
                        {playerName(p)}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-500">
                      {p.position || p.role || "—"}
                    </td>
                    <td className="py-2 px-3 text-center tabular-nums">
                      {goals}
                    </td>
                    <td className="py-2 px-3 text-center tabular-nums">
                      {assists ?? 0}
                    </td>
                    <td className="py-2 px-3 text-center tabular-nums">
                      {yc}
                    </td>
                    <td className="py-2 px-3 text-center tabular-nums">
                      {rc}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  /* ---------- TABLEAU STAFF ---------- */
  function StaffTable() {
    if (!Array.isArray(staff) || staff.length === 0) return null;
    return (
      <div className="rounded-2xl ring-1 ring-black/10 overflow-hidden bg-white">
        <div className="px-4 py-3 font-semibold border-b bg-gray-50">
          Staff
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-100">
              <tr className="text-gray-600">
                <th className="w-14 py-2 px-3 text-left">#</th>
                <th className="w-16 py-2 px-3 text-left">Photo</th>
                <th className="py-2 px-3 text-left">Nom</th>
                <th className="w-40 py-2 px-3 text-left">Rôle</th>
                <th className="w-48 py-2 px-3 text-left">Contact</th>
                <th className="w-28 py-2 px-3 text-left">Statut</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s, idx) => {
                const staffName =
                  s.full_name ||
                  s.name ||
                  [s.first_name, s.last_name].filter(Boolean).join(" ") ||
                  "—";
                return (
                  <tr key={s.id ?? idx} className="border-t">
                    <td className="py-2 px-3 text-gray-600">
                      {s.id ?? idx + 1}
                    </td>
                    <td className="py-2 px-3">
                      <Avatar
                        src={s.photo || s.avatar}
                        alt={staffName}
                        onClick={s.id ? () => openStaffSheet(s.id) : undefined}
                      />
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-medium">{staffName}</span>
                    </td>
                    <td className="py-2 px-3">
                      {s.role_display || s.role || s.title || "—"}
                    </td>
                    <td className="py-2 px-3">
                      {s.phone ? (
                        <>
                          <a
                            href={`tel:${s.phone}`}
                            className="hover:underline"
                          >
                            {s.phone}
                          </a>
                          <br />
                        </>
                      ) : (
                        "—"
                      )}
                      {s.email && (
                        <span className="text-xs text-gray-500 break-all">
                          <a
                            href={`mailto:${s.email}`}
                            className="hover:underline"
                          >
                            {s.email}
                          </a>
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <span className="inline-flex items-center gap-2 text-xs">
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${
                            s.is_active ? "bg-emerald-500" : "bg-gray-300"
                          }`}
                        />
                        {s.is_active ? "Actif" : "Inactif"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      {/* Entête club */}
      <div className="p-4 rounded-2xl ring-1 ring-black/10 bg-white flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <ClubLogo src={club.logo} alt={club.name} />
          <div className="min-w-0">
            <h1 className="text-xl font-semibold truncate">{club.name}</h1>
            <div className="text-sm text-gray-500 truncate">
              {[club.city || club.location, club.stadium || club.venue]
                .filter(Boolean)
                .join(" • ")}
            </div>
          </div>
        </div>
        <Link
          to="/clubs"
          className="ml-auto shrink-0 px-3 py-1.5 rounded-xl text-sm ring-1 ring-black/10 hover:bg-gray-50"
        >
          ← Tous les clubs
        </Link>
      </div>

      {/* Infos principales */}
      <div className="grid md:grid-cols-2 gap-3">
        {(club.city || club.location) && (
          <div className="p-3 rounded-xl ring-1 ring-black/10 bg-white">
            <div className="text-[11px] text-gray-500 uppercase">Ville</div>
            <div className="font-medium text-[14px]">
              {club.city || club.location}
            </div>
          </div>
        )}

        {(club.stadium || club.venue) && (
          <div className="p-3 rounded-xl ring-1 ring-black/10 bg-white">
            <div className="text-[11px] text-gray-500 uppercase">Stade</div>
            <div className="font-medium text-[14px]">
              {club.stadium || club.venue}
            </div>
          </div>
        )}

        {(club.founded || club.founded_year) && (
          <div className="p-3 rounded-xl ring-1 ring-black/10 bg-white">
            <div className="text-[11px] text-gray-500 uppercase">
              Fondation
            </div>
            <div className="font-medium text-[14px]">
              {club.founded || club.founded_year}
            </div>
          </div>
        )}

        {club.colors && (
          <div className="p-3 rounded-xl ring-1 ring-black/10 bg-white">
            <div className="text-[11px] text-gray-500 uppercase">Couleurs</div>
            <div className="font-medium text-[14px]">{club.colors}</div>
          </div>
        )}
      </div>

      {/* EFFECTIF PAR POSTES */}
      <SectionTable title="Gardiens" list={grouped.Gardiens} />
      <SectionTable title="Défenseurs" list={grouped.Défenseurs} />
      <SectionTable title="Milieux" list={grouped.Milieux} />
      <SectionTable title="Attaquants" list={grouped.Attaquants} />
      <SectionTable title="Autres" list={grouped.Autres} />

      {/* STAFF */}
      <StaffTable />
    </section>
  );
}
