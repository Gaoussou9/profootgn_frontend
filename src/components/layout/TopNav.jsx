// src/components/layout/TopNav.jsx
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/journees", label: "Matchs" },
  { to: "/classement", label: "Classement" },
  { to: "/buteurs", label: "Buteurs" },
  { to: "/passeurs", label: "Passeurs" },
  { to: "/clubs", label: "Clubs" },
];

export default function TopNav() {
  const { pathname } = useLocation();

  return (
    // hidden on mobile, visible from md and up
    <div className="hidden md:block sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-4xl px-4 py-2 pt-[env(safe-area-inset-top)]">
        {/* Ligne 1 — Brand */}
        <div className="flex items-center justify-between h-12">
          <Link to="/journees" className="font-extrabold tracking-tight text-slate-900">
            ProFootGN
          </Link>

          {/* Optionnel: placeholder pour search / actions */}
          <div className="flex items-center gap-3">
            {/* leave empty for now or add icons later */}
          </div>
        </div>

        {/* Ligne 2 — Tabs (desktop) */}
        <div className="mt-2 flex gap-3 items-center">
          {tabs.map((t) => {
            const active = pathname === t.to || (t.to !== "/journees" && pathname.startsWith(t.to));
            return (
              <Link
                key={t.to}
                to={t.to}
                aria-current={active ? "page" : undefined}
                className={[
                  "rounded-full px-4 py-2 text-sm ring-1 transition",
                  active
                    ? "bg-blue-600 text-white ring-blue-600"
                    : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50",
                ].join(" ")}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
