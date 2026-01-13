// src/components/layout/BottomNav.jsx
import { NavLink } from "react-router-dom";
import { FaFutbol, FaChartBar, FaUserAlt, FaRegHandshake, FaTrophy } from "react-icons/fa";
import { GiGoalKeeper } from "react-icons/gi";

const navItems = [
  { to: "/journees", label: "Matchs", Icon: FaFutbol },
  { to: "/competitions", label: "Compétitions", Icon: FaTrophy }, // ✅ AJOUT
  { to: "/classement", label: "Classement", Icon: FaChartBar },
  { to: "/buteurs", label: "Buteurs", Icon: GiGoalKeeper },
  { to: "/passeurs", label: "Passeurs", Icon: FaRegHandshake },
  { to: "/clubs", label: "Clubs", Icon: FaUserAlt },
];

export default function BottomNav() {
  return (
    // md:hidden pour mobile-only ; nav centrée avec max-w identique aux cartes
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" aria-label="Navigation principale">
      {/* Conteneur centré : change max-w-3xl si tu veux une autre largeur (ex: max-w-2xl) */}
      <div className="mx-auto w-full max-w-3xl px-4">
        <div
          className="bg-white rounded-t-xl shadow-[0_-3px_10px_rgba(0,0,0,0.06)] border border-slate-200 py-1.5 flex justify-between items-center"
          role="menubar"
          style={{ marginBottom: "6px" }} // petit espace avant le safe area
        >
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              role="menuitem"
              aria-label={label}
              className={({ isActive }) =>
                `flex-1 text-center flex flex-col items-center justify-center gap-0.5 py-0.5 transition-all duration-150 ${
                  isActive ? "text-yellow-600 font-semibold" : "text-slate-600"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`flex items-center justify-center w-9 h-9 rounded-lg transition-transform ${
                      isActive ? "bg-yellow-400 text-white scale-105" : "bg-transparent text-slate-600"
                    }`}
                  >
                    <Icon className="w-[18px] h-[18px]" />
                  </span>

                  <span className="text-[10px] leading-none truncate">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* safe-area pour iPhones */}
        <div style={{ height: "env(safe-area-inset-bottom)" }} />
      </div>
    </nav>
  );
}
