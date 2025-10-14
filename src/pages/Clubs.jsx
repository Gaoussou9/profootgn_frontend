// src/pages/Clubs.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

/* --- Logo compact (ne rétrécit pas) --- */
const ClubLogo = ({ src, alt }) => (
  <img
    src={src || "/club-placeholder.png"}
    alt={alt}
    className="w-10 h-10 sm:w-12 sm:h-12 rounded-md object-contain ring-1 ring-slate-200 bg-white shrink-0"
    onError={(e) => (e.currentTarget.src = "/club-placeholder.png")}
  />
);

export default function Clubs() {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [err, setErr] = useState(null);

  useEffect(() => {
    let stop = false;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get("clubs/"); // adapte si besoin
        const arr = Array.isArray(data) ? data : data?.results || [];
        if (!stop) setClubs(arr);
      } catch (e) {
        if (!stop) setErr(e?.message || "Erreur de chargement");
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return clubs;
    return clubs.filter((c) =>
      [c.name, c.city, c.location].filter(Boolean).some((v) => String(v).toLowerCase().includes(s))
    );
  }, [q, clubs]);

  if (loading) return <p className="px-3 py-4">Chargement…</p>;
  if (err) return <p className="px-3 py-4 text-red-600">Erreur : {err}</p>;

  return (
    <section className="mx-auto max-w-3xl sm:max-w-5xl px-3 py-4 space-y-3">
      {/* Titre + champ de recherche (desktop) */}
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Clubs</h1>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un club…"
          className="hidden sm:block w-64 bg-white rounded-full px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </header>

      {/* Champ de recherche (mobile pleine largeur) */}
      <div className="sm:hidden">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher un club…"
          className="w-full bg-white rounded-full px-3 py-2 text-sm ring-1 ring-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
      </div>

      {/* === Grille: 2 colonnes dès mobile, 3 en md, 4 en xl === */}
      <div className="grid gap-2 grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
        {filtered.map((c) => {
          const city = c.city || c.location || "";
          return (
            <Link
              key={c.id}
              to={`/clubs/${c.id}`}
              className="no-underline bg-white rounded-xl ring-1 ring-slate-200 shadow-[0_2px_10px_rgba(2,6,23,0.05)] p-2.5 sm:p-3 hover:shadow-md transition"
            >
              {/* Ligne compacte, texte sur 2 lignes (nom puis ville) */}
              <div className="flex items-center gap-2.5 min-w-0">
                <ClubLogo src={c.logo} alt={c.name} />
                <div className="min-w-0">
                  <div className="text-[13px] sm:text-base font-medium leading-tight truncate">
                    {c.name}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500 truncate">
                    {city}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
