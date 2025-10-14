import { useEffect, useRef, useState, useCallback, createContext, useContext } from "react";
import api from "../api/client";
import { Link } from "react-router-dom";

/* ---------------------------------------------------------
   Context pour ouvrir/fermer la fiche globalement
----------------------------------------------------------*/
const PlayerSheetContext = createContext(null);

export function PlayerSheetProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [playerId, setPlayerId] = useState(null);

  const openSheet = useCallback((id) => {
    if (!id) return;
    setPlayerId(id);
    setOpen(true);
  }, []);

  // 🔎 Ouvrir par nom (et club si dispo) -> résout l'ID via /players/search/
  const openSheetByName = useCallback(async (name, clubId = null) => {
    const q = String(name || "").trim();
    if (!q) return;
    try {
      const url = clubId
        ? `players/search/?q=${encodeURIComponent(q)}&club=${clubId}&limit=1`
        : `players/search/?q=${encodeURIComponent(q)}&limit=1`;
      const r = await api.get(url);
      const arr = Array.isArray(r.data) ? r.data : [];
      const id = arr[0]?.id;
      if (id) {
        setPlayerId(id);
        setOpen(true);
      }
    } catch {
      // silencieux
    }
  }, []);

  // 🧠 Ouverture « smart »: id direct OU {id,name,clubId}
  const openSheetSmart = useCallback((arg) => {
    if (!arg) return;
    if (typeof arg === "number" || (typeof arg === "string" && /^\d+$/.test(arg))) {
      openSheet(Number(arg));
      return;
    }
    const { id, name, clubId } = arg || {};
    if (id) return openSheet(id);
    if (name) return openSheetByName(name, clubId);
  }, [openSheet, openSheetByName]);

  const closeSheet = useCallback(() => {
    setOpen(false);
    setTimeout(() => setPlayerId(null), 150);
  }, []);

  return (
    <PlayerSheetContext.Provider value={{ openSheet, openSheetByName, openSheetSmart, closeSheet }}>
      {children}
      <PlayerSheetRoot open={open} playerId={playerId} onClose={closeSheet} />
    </PlayerSheetContext.Provider>
  );
}

export function usePlayerSheet() {
  const ctx = useContext(PlayerSheetContext);
  if (!ctx) throw new Error("usePlayerSheet must be used within <PlayerSheetProvider>");
  return ctx;
}

/* ---------------------------------------------------------
   Racine du modal
----------------------------------------------------------*/
function PlayerSheetRoot({ open, playerId, onClose }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      try { dlg.showModal(); } catch (_) {}
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  const onClick = (e) => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const rect = dlg.getBoundingClientRect();
    const inDialog = (
      rect.top <= e.clientY && e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX && e.clientX <= rect.left + rect.width
    );
    if (!inDialog) onClose();
  };

  return (
    <dialog ref={dialogRef} className="backdrop:bg-black/50 rounded-2xl p-0 w-[1100px] max-w-[96vw]">
      <div className="bg-white rounded-2xl overflow-hidden" onClick={onClick}>
        <PlayerSheetBody playerId={playerId} onClose={onClose} />
      </div>
    </dialog>
  );
}

/* ---------------------------------------------------------
   Corps : fetch + rendu
----------------------------------------------------------*/
function PlayerSheetBody({ playerId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [p, setP] = useState(null);

  useEffect(() => {
    if (!playerId) return;
    let alive = true;
    setLoading(true);
    setError(null);
    api.get(`/players/${playerId}/`)
      .then((res) => { if (alive) setP(res.data); })
      .catch((err) => { if (alive) setError(err?.response?.data || "Erreur de chargement"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [playerId]);

  return (
    <div className="p-6 space-y-6">
      {/* Barre d’actions */}
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold">Fiche joueur</h2>
        <button onClick={onClose} className="px-3 py-1.5 rounded-xl text-sm bg-gray-100 hover:bg-gray-200">Fermer</button>
      </div>

      {/* 1) EN-TÊTE */}
      <section className="grid grid-cols-12 gap-6">
        {/* Photo */}
        <div className="col-span-12 sm:col-span-3">
          {loading ? (
            <div className="aspect-square bg-gray-100 animate-pulse rounded-xl" />
          ) : (
            <img
              src={p?.photo || "/player-placeholder.png"}
              alt={p?.name || "Joueur"}
              className="w-full aspect-square object-cover rounded-xl ring-1 ring-black/10 bg-white"
              onError={(e) => (e.currentTarget.src = "/player-placeholder.png")}
            />
          )}
        </div>

        {/* Infos principales */}
        <div className="col-span-12 sm:col-span-9">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-2xl font-bold">{p?.full_name || p?.name || "—"}</div>
            {p?.nickname && <span className="text-sm px-2 py-0.5 rounded-full bg-gray-100">“{p.nickname}”</span>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <Badge>{p?.position_long || p?.position || "Poste —"}</Badge>
            {p?.number != null && <Badge># {p.number}</Badge>}
            {p?.club_name && (
              <Badge>
                <span className="inline-flex items-center gap-2">
                  <img src={p.club_logo || "/club-placeholder.png"} alt={p.club_name} className="w-4 h-4 object-contain" />
                  <Link to={`/clubs/${p.club_id}`} className="underline hover:no-underline">{p.club_name}</Link>
                </span>
              </Badge>
            )}
            {p?.nationality_flag || p?.nationality ? (
              <Badge>
                <span className="inline-flex items-center gap-1">
                  {p?.nationality_flag && <img src={p.nationality_flag} alt={p.nationality} className="w-4 h-3 object-cover rounded-sm" />}
                  <span>{p?.nationality || "—"}</span>
                </span>
              </Badge>
            ) : null}
            {p?.preferred_foot && <Badge>Pied: {p.preferred_foot}</Badge>}
            {p?.age != null && <Badge>Âge: {p.age}</Badge>}
            {p?.date_of_birth && <Badge>Né: {fmtDate(p.date_of_birth)}</Badge>}
          </div>
        </div>
      </section>

      {/* 2) INFORMATIONS PERSONNELLES */}
      <Section title="Informations personnelles">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <Field label="Date & lieu de naissance" value={joinNonEmpty([fmtDate(p?.date_of_birth), p?.place_of_birth])} />
          <Field label="Taille & poids" value={joinNonEmpty([p?.height_cm && `${p.height_cm} cm`, p?.weight_kg && `${p.weight_kg} kg`])} />
          <Field label="Club actuel" value={p?.club_name} />
          <Field label="Fin de contrat" value={p?.contract_end && fmtDate(p.contract_end)} />
          <Field label="Agent / Représentant" value={p?.agent_name} />
        </div>
      </Section>

      {/* 3) STATISTIQUES SPORTIVES */}
      <Section title="Statistiques sportives">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          <StatCard label="Matches" value={p?.stats?.matches_count ?? "—"} />
          <StatCard label="Buts" value={p?.stats?.goals ?? "—"} />
          <StatCard label="Passes" value={p?.stats?.assists ?? "—"} />
          <StatCard label="Jaunes" value={p?.stats?.cards_yellow ?? "—"} />
          <StatCard label="Rouges" value={p?.stats?.cards_red ?? "—"} />
          <StatCard label="Minutes" value={p?.stats?.minutes ?? "—"} />
        </div>
        {/* Historique par saison/compétition */}
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Saison</th>
                <th className="py-2 pr-4">Compétition</th>
                <th className="py-2 pr-4">Matches</th>
                <th className="py-2 pr-4">Buts</th>
                <th className="py-2 pr-4">Passes</th>
                <th className="py-2 pr-0">Minutes</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {p?.performance_history?.length ? p.performance_history.map((row, idx) => (
                <tr key={idx}>
                  <td className="py-2 pr-4">{row.season}</td>
                  <td className="py-2 pr-4">{row.competition || "—"}</td>
                  <td className="py-2 pr-4">{row.matches ?? "—"}</td>
                  <td className="py-2 pr-4">{row.goals ?? "—"}</td>
                  <td className="py-2 pr-4">{row.assists ?? "—"}</td>
                  <td className="py-2 pr-0">{row.minutes ?? "—"}</td>
                </tr>
              )) : (
                <tr><td className="py-2 text-gray-500" colSpan={6}>Aucun historique.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 4) HISTORIQUE DES CLUBS */}
      <Section title="Historique des clubs">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-2 pr-4">Saison</th>
                <th className="py-2 pr-4">Club</th>
                <th className="py-2 pr-4">Matchs</th>
                <th className="py-2 pr-0">Buts</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {p?.club_history?.length ? p.club_history.map((row, idx) => (
                <tr key={idx}>
                  <td className="py-2 pr-4">{row.season}</td>
                  <td className="py-2 pr-4">{row.club}</td>
                  <td className="py-2 pr-4">{row.matches ?? "—"}</td>
                  <td className="py-2 pr-0">{row.goals ?? "—"}</td>
                </tr>
              )) : (
                <tr><td className="py-2 text-gray-500" colSpan={4}>Aucun historique de club.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      {/* 5) MÉDIAS */}
      <Section title="Vidéos & Galerie">
        {p?.media?.videos?.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {p.media.videos.map((v, i) => (
              <div key={i} className="aspect-video bg-black/5 rounded-xl overflow-hidden ring-1 ring-black/5">
                {v.embed_url ? (
                  <iframe src={v.embed_url} title={v.title || `video-${i}`} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen />
                ) : v.url ? (
                  <video src={v.url} controls className="w-full h-full" />
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-gray-500">Vidéo indisponible</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Aucune vidéo.</div>
        )}

        <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {(p?.media?.photos?.length ? p.media.photos : []).map((ph, i) => (
            <img key={i} src={ph} alt={`photo-${i}`} className="aspect-square object-cover rounded-lg ring-1 ring-black/5 bg-white" onError={(e) => (e.currentTarget.style.display = 'none')} />
          ))}
          {!p?.media?.photos?.length && (
            <div className="col-span-full text-sm text-gray-500">Aucune photo supplémentaire.</div>
          )}
        </div>
      </Section>

      {/* 6) INFOS AVANCÉES RECRUTEURS */}
      <Section title="Informations avancées (recruteurs)">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Valeur estimée" value={p?.market_value ?? "—"} />
          <StatCard label="Vitesse" value={p?.scouting?.speed ?? "—"} />
          <StatCard label="Puissance" value={p?.scouting?.power ?? "—"} />
          <StatCard label="Vision du jeu" value={p?.scouting?.vision ?? "—"} />
          <StatCard label="Technique" value={p?.scouting?.technique ?? "—"} />
          <StatCard label="Endurance" value={p?.scouting?.stamina ?? "—"} />
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Field label="Observations" value={p?.scouting?.notes} multiline />
          <Field label="Historique médical" value={p?.medical_history} multiline />
        </div>
        {Array.isArray(p?.ratings) && p.ratings.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="py-2 pr-4">Source</th>
                  <th className="py-2 pr-4">Note</th>
                  <th className="py-2 pr-0">Commentaire</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {p.ratings.map((r, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-4">{r.source || "—"}</td>
                    <td className="py-2 pr-4">{r.value ?? "—"}</td>
                    <td className="py-2 pr-0">{r.comment || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {error && (<div className="text-sm text-red-600">{String(error)}</div>)}
    </div>
  );
}

/* ---------------------------------------------------------
   Sous-composants UI
----------------------------------------------------------*/
function Section({ title, children }) {
  return (
    <section className="bg-gray-50 rounded-2xl ring-1 ring-black/5 p-4">
      <div className="text-sm font-semibold border-b pb-2 mb-3">{title}</div>
      {children}
    </section>
  );
}

function Card({ title, children }) {
  return (
    <section className="bg-gray-50 rounded-2xl ring-1 ring-black/5">
      <div className="px-4 py-3 border-b text-sm font-semibold">{title}</div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Badge({ children }) {
  return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 ring-1 ring-black/5">{children}</span>;
}

function Field({ label, value, multiline }) {
  const v = value || "—";
  return (
    <div>
      <div className="text-xs text-gray-500">{label}</div>
      {multiline ? (
        <div className="text-sm whitespace-pre-line">{v}</div>
      ) : (
        <div className="text-sm">{v}</div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl p-4 ring-1 ring-black/5">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

/* ---------------------------------------------------------
   Helpers
----------------------------------------------------------*/
function fmtDate(iso) {
  try {
    if (!iso) return null;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${day}/${m}/${y}`;
  } catch { return iso; }
}

function joinNonEmpty(arr) {
  return (arr || []).filter(Boolean).join(" · ");
}

/* ---------------------------------------------------------
   Avatar cliquable à utiliser partout
----------------------------------------------------------*/
export function PlayerAvatar({ id, src, alt, size = 36, className = "" }) {
  const { openSheet } = usePlayerSheet();
  return (
    <button
      type="button"
      onClick={() => openSheet(id)}
      className={`inline-flex items-center justify-center rounded-full ring-1 ring-black/10 overflow-hidden bg-white ${className}`}
      style={{ width: size, height: size }}
      aria-label={alt || "Voir fiche joueur"}
      title={alt || "Voir fiche joueur"}
    >
      <img
        src={src || "/player-placeholder.png"}
        alt={alt || "Joueur"}
        className="w-full h-full object-cover"
        onError={(e) => (e.currentTarget.src = "/player-placeholder.png")}
      />
    </button>
  );
}
