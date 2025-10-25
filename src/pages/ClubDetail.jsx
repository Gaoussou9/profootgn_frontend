// src/pages/ClubDetail.jsx
import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client";
import { usePlayerSheet } from "../components/PlayerSheet"; // ✅ fiche joueur
import { useStaffSheet } from "../components/StaffSheet";   // ✅ fiche staff

/* ---------- Réglage taille icônes de l’entête ---------- */
const ICON_SIZE = 50; // <- ajuste ici pour matcher visuellement ⚽/🟨/🟥

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
      // fallback si l'image n'existe pas
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

/* ---------- Mapping postes -> groupe ---------- */
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

/* ---------- util ---------- */
const stat = (obj, keys) => {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return "0";
};

/* ================================================================== */

export default function ClubDetail() {
  const { id } = useParams();
  const { openSheet } = usePlayerSheet();                // ✅ joueurs
  const { openSheet: openStaffSheet } = useStaffSheet(); // ✅ staff

  const [club, setClub] = useState(null);
  const [players, setPlayers] = useState([]);
  const [staff, setStaff] = useState([]);

  // agrégats (⚽/assist/cartons) par joueur renvoyés par l’API
  // totals[playerId] = { goals, assists, yellows, reds }
  const [totals, setTotals] = useState({});

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Charge club + effectif + staff (une seule fois au mount + quand id change)
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

        // Joueurs
        try {
          const r = await api.get(`players/?club=${id}&ordering=number`);
          const arr = Array.isArray(r.data) ? r.data : r.data?.results || [];
          if (!stop && Array.isArray(arr)) setPlayers(arr);
        } catch {
          if (!stop) setPlayers([]);
        }

        // Staff (actifs)
        try {
          const r = await api.get(`staff/?club=${id}&active=1&ordering=full_name`);
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

  // Charge/rafraîchit les totaux (⚽/👟/🟨/🟥) depuis l’API d’agrégats
  // et rafraîchit toutes les 12s + quand l'onglet redevient visible
  useEffect(() => {
    let stop = false;
    let timer;

    const fetchTotals = async () => {
      try {
        // Exemple de réponse attendue :
        // {
        //   club: {...},
        //   players: [
        //     { id: 12, goals: 3, assists: 1, yc: 2, rc: 0, ... },
        //     ...
        //   ]
        // }
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

    fetchTotals(); // premier chargement
    timer = setInterval(fetchTotals, 12000); // rafraîchit toutes les 12s

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

  const playerName = (p) =>
    p?.name || [p?.first_name, p?.last_name].filter(Boolean).join(" ") || "—";

  /* ---------- Groupes de joueurs + tri ---------- */
  const grouped = useMemo(() => {
    const buckets = {
      Gardiens: [],
      Défenseurs: [],
      Milieux: [],
      Attaquants: [],
      Autres: [],
    };
    (players || []).forEach((p) => buckets[positionCategory(p)].push(p));

    const sortPlayers = (a, b) => {
      const na = Number.isFinite(Number(a.number)) ? Number(a.number) : 9999;
      const nb = Number.isFinite(Number(b.number)) ? Number(b.number) : 9999;
      if (na !== nb) return na - nb;
      return (playerName(a) || "").localeCompare(playerName(b) || "", "fr", {
        sensitivity: "base",
      });
    };
    Object.keys(buckets).forEach((k) => buckets[k].sort(sortPlayers));
    return buckets;
  }, [players]);

  if (loading) return <p>Chargement…</p>;
  if (err) return <p className="text-red-600">Erreur : {err}</p>;
  if (!club) return <p>Club introuvable.</p>;

  /* ---------- TABLEAU JOUEURS (toujours affiché) ---------- */
  const SectionTable = ({ title, list }) =>
    list.length > 0 && (
      <div className="rounded-2xl ring-1 ring-black/10 overflow-hidden bg-white">
        {/* Barre titre verte */}
        <div className="px-4 py-2 bg-emerald-700 text-white font-semibold">
          {title.toUpperCase()}
        </div>

        {/* wrapper scroll horizontal si l'écran est étroit */}
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
              {list.map((p, idx) => {
                const t = totals[p.id] || {};
                const goals = t.goals ?? stat(p, ["goals", "g", "buts"]);
                const assists =
                  t.assists ?? stat(p, ["assists", "assist", "a", "passes_decisives"]);
                const yc =
                  t.yellows ?? stat(p, ["yellow_cards", "yc", "cartons_jaunes"]);
                const rc =
                  t.reds ?? stat(p, ["red_cards", "rc", "cartons_rouges"]);

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
                      {assists}
                    </td>
                    <td className="py-2 px-3 text-center tabular-nums">{yc}</td>
                    <td className="py-2 px-3 text-center tabular-nums">{rc}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );

  /* ---------- TABLEAU STAFF (toujours affiché) ---------- */
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

      {/* EFFECTIF PAR POSTES : tableaux (toujours affichés) */}
      <SectionTable title="Gardiens" list={grouped.Gardiens} />
      <SectionTable title="Défenseurs" list={grouped.Défenseurs} />
      <SectionTable title="Milieux" list={grouped.Milieux} />
      <SectionTable title="Attaquants" list={grouped.Attaquants} />
      <SectionTable title="Autres" list={grouped.Autres} />

      {/* STAFF : tableau (toujours affiché) */}
      <StaffTable />
    </section>
  );
}
