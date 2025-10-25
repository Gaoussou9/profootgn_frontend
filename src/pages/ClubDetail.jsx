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
  const [totals, setTotals] = useState({}); // { [playerId]: {goals, assists, yellows, reds} }

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  // Charge club + effectif + staff
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
  useEffect(() => {
    let stop = false;
    let timer;

    const fetchTotals = async () => {
      try {
        // Réponse: { club: {...}, players: [{id, goals, assists, yc, rc, ...}, ...] }
        const r = await api.get(`clubs/${id}/players-stats/?include_live=1`);
        const arr = Array.isArray(r.data?.players) ? r.data.players : [];
        const map = {};
        arr.forEach((p) => {
          if (p?.id != null) {
            map[p.id] = {
              goals: Number(p.goals || 0),
              assists: Number(p.assists || 0),
              yellows: Number(p.yc || 0),
              reds: Number(p.rc || 0),
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

  /* ---------- Petit composant de stats pour mobile ---------- */
  function StatPill({ icon, value }) {
    return (
      <div className="flex items-center gap-1 text-[11px] leading-none font-medium">
        <span className="inline-flex items-center justify-center w-4 h-4 text-[14px]">
          {icon}
        </span>
        <span className="tabular-nums">{value}</span>
      </div>
    );
  }

  /* ---------- Ligne joueur pour MOBILE ---------- */
  function PlayerRowMobile({ p, idx, groupName }) {
    const t = totals[p.id] || {};
    const goals = t.goals ?? stat(p, ["goals", "g", "buts"]);
    const assists =
      t.assists ?? stat(p, ["assists", "a", "passes_decisives"]);
    const yc =
      t.yellows ?? stat(p, ["yellow_cards", "yc", "cartons_jaunes"]);
    const rc =
      t.reds ?? stat(p, ["red_cards", "rc", "cartons_rouges"]);

    const num = p.number ?? idx + 1;
    const pos = p.position || p.role || "—";
    const nameDisplay = playerName(p);

    return (
      <div
        key={p.id ?? `${groupName}-${idx}`}
        className="flex items-start gap-3 p-3 border-t border-gray-100"
      >
        {/* numéro + avatar */}
        <div className="flex flex-col items-center shrink-0 w-12 text-center">
          <div className="text-[11px] text-gray-500 tabular-nums">{num}</div>
          <Avatar
            src={
              p.photo ||
              p.player_photo ||
              p.avatar ||
              p.image ||
              p.image_url
            }
            alt={nameDisplay}
            onClick={p.id ? () => openSheet(p.id) : undefined}
          />
        </div>

        {/* infos joueur */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between gap-2">
            <div className="font-medium text-[14px] leading-tight truncate">
              {nameDisplay}
            </div>
            <div className="text-[11px] text-gray-500 whitespace-nowrap">
              {pos}
            </div>
          </div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-gray-700">
            <StatPill icon="⚽" value={goals} />
            <StatPill icon={<AssistIcon size={16} />} value={assists} />
            <StatPill icon="🟨" value={yc} />
            <StatPill icon="🟥" value={rc} />
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Bloc groupe joueurs MOBILE ---------- */
  function PlayerGroupMobile({ title, list }) {
    if (!list.length) return null;
    return (
      <div className="rounded-2xl ring-1 ring-black/10 bg-white overflow-hidden mb-4">
        <div className="px-4 py-2 bg-emerald-700 text-white text-xs font-semibold tracking-wide">
          {title.toUpperCase()}
        </div>
        {list.map((p, idx) => (
          <PlayerRowMobile
            p={p}
            idx={idx}
            key={p.id ?? idx}
            groupName={title}
          />
        ))}
      </div>
    );
  }

  /* ---------- Tableau joueurs DESKTOP/TABLET (>= md) ---------- */
  const SectionTable = ({ title, list }) =>
    list.length > 0 && (
      <div className="hidden md:block rounded-2xl ring-1 ring-black/10 overflow-hidden bg-white">
        {/* Barre titre verte */}
        <div className="px-4 py-2 bg-emerald-700 text-white font-semibold">
          {title.toUpperCase()}
        </div>

        <table className="w-full text-sm">
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
                t.assists ?? stat(p, ["assists", "a", "passes_decisives"]);
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
    );

  /* ---------- Staff : MOBILE CARD LIST (toujours visible) ---------- */
  function StaffMobile() {
    if (!Array.isArray(staff) || staff.length === 0) return null;
    return (
      <div className="block rounded-2xl ring-1 ring-black/10 overflow-hidden bg-white">
        <div className="px-4 py-2 bg-gray-100 font-semibold text-sm border-b">
          Staff
        </div>

        {staff.map((s, idx) => {
          const staffName =
            s.full_name ||
            s.name ||
            [s.first_name, s.last_name].filter(Boolean).join(" ") ||
            "—";

          return (
            <div
              key={s.id ?? idx}
              className="flex items-start gap-3 p-3 border-t border-gray-100"
            >
              <div className="flex flex-col items-center shrink-0 w-12 text-center">
                <div className="text-[11px] text-gray-500 tabular-nums">
                  {s.id ?? idx + 1}
                </div>
                <Avatar
                  src={s.photo || s.avatar}
                  alt={staffName}
                  onClick={s.id ? () => openStaffSheet(s.id) : undefined}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium text-[14px] leading-tight">
                  {staffName}
                </div>
                <div className="text-[11px] text-gray-500 mt-0.5">
                  {s.role_display || s.role || s.title || "—"}
                </div>

                {(s.phone || s.email) && (
                  <div className="mt-2 text-[12px] leading-snug">
                    {s.phone ? (
                      <div>
                        <a
                          href={`tel:${s.phone}`}
                          className="hover:underline text-gray-700 break-all"
                        >
                          {s.phone}
                        </a>
                      </div>
                    ) : null}
                    {s.email ? (
                      <div className="text-gray-500 break-all">
                        <a
                          href={`mailto:${s.email}`}
                          className="hover:underline"
                        >
                          {s.email}
                        </a>
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="mt-2 inline-flex items-center gap-2 text-[11px]">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      s.is_active ? "bg-emerald-500" : "bg-gray-300"
                    }`}
                  />
                  <span className="text-gray-600">
                    {s.is_active ? "Actif" : "Inactif"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ---------- Staff : DESKTOP/TABLET TABLE (>= md) ---------- */
  function StaffDesktop() {
    if (!Array.isArray(staff) || staff.length === 0) return null;
    return (
      <div className="hidden md:block rounded-2xl ring-1 ring-black/10 overflow-hidden bg-white">
        <div className="px-4 py-3 font-semibold border-b">Staff</div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
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
                      <a href={`tel:${s.phone}`} className="hover:underline">
                        {s.phone}
                      </a>
                    ) : (
                      "—"
                    )}
                    {s.email && (
                      <div className="text-xs text-gray-500 break-all">
                        <a
                          href={`mailto:${s.email}`}
                          className="hover:underline"
                        >
                          {s.email}
                        </a>
                      </div>
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
    );
  }

  return (
    <section className="space-y-4">
      {/* Entête club */}
      <div className="p-4 rounded-2xl ring-1 ring-black/10 bg-white flex items-center justify-between">
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
          className="ml-3 shrink-0 px-3 py-1.5 rounded-xl text-sm ring-1 ring-black/10 hover:bg-gray-50"
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
            <div className="text-[11px] text-gray-500 uppercase">Fondation</div>
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

      {/* EFFECTIF PAR POSTES - VERSION MOBILE (cartes empilées, toujours visible) */}
      <div className="">
        <PlayerGroupMobile title="Gardiens" list={grouped.Gardiens} />
        <PlayerGroupMobile title="Défenseurs" list={grouped.Défenseurs} />
        <PlayerGroupMobile title="Milieux" list={grouped.Milieux} />
        <PlayerGroupMobile title="Attaquants" list={grouped.Attaquants} />
        <PlayerGroupMobile title="Autres" list={grouped.Autres} />
      </div>

      {/* EFFECTIF PAR POSTES - VERSION DESKTOP/TABLET (>= md) */}
      <SectionTable title="Gardiens" list={grouped.Gardiens} />
      <SectionTable title="Défenseurs" list={grouped.Défenseurs} />
      <SectionTable title="Milieux" list={grouped.Milieux} />
      <SectionTable title="Attaquants" list={grouped.Attaquants} />
      <SectionTable title="Autres" list={grouped.Autres} />

      {/* STAFF MOBILE (toujours visible) */}
      <StaffMobile />

      {/* STAFF DESKTOP/TABLET (>= md) */}
      <StaffDesktop />
    </section>
  );
}
