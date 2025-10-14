// src/components/layout/TopNav.jsx
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/",           label: "Accueil" },
  { to: "/classement", label: "Classement" },
  { to: "/buteurs",    label: "Buteurs" },
  { to: "/passeurs",   label: "Passeurs" },
  { to: "/clubs",      label: "Clubs" },
];

export default function TopNav() {
  const { pathname } = useLocation();

  return (
    <div className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-3xl sm:max-w-5xl px-3 pt-[env(safe-area-inset-top)]">
        {/* Ligne 1 — Brand + (option: search plus tard) */}
        <div className="flex items-center justify-between h-12">
          <Link to="/" className="font-extrabold tracking-tight text-slate-900">
            ProFootGN
          </Link>
        </div>

        {/* Ligne 2 — Tabs scrollables sur mobile */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar fade-x pb-2 -mb-1">
          {tabs.map((t) => {
            const active = pathname === t.to || (t.to !== "/" && pathname.startsWith(t.to));
            return (
              <Link
                key={t.to}
                to={t.to}
                className={[
                  "shrink-0 rounded-full px-3 py-1.5 text-sm ring-1 transition",
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
