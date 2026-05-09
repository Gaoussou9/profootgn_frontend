import { NavLink } from "react-router-dom";

import {
  FaFutbol,
  FaChartBar,
  FaUserAlt,
  FaRegHandshake,
  FaTrophy,
} from "react-icons/fa";

import { GiGoalKeeper } from "react-icons/gi";

const navItems = [
  {
    to: "/journees",
    label: "Matchs",
    Icon: FaFutbol,
  },

  {
    to: "/competitions",
    label: "Compétitions",
    Icon: FaTrophy,
  },

  {
    to: "/classement",
    label: "Classement",
    Icon: FaChartBar,
  },

  {
    to: "/buteurs",
    label: "Buteurs",
    Icon: GiGoalKeeper,
  },

  {
    to: "/passeurs",
    label: "Passeurs",
    Icon: FaRegHandshake,
  },

  {
    to: "/clubs",
    label: "Clubs",
    Icon: FaUserAlt,
  },
];

export default function BottomNav() {

  return (

    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-[9999]
      "
      aria-label="Navigation principale"
    >

      {/* WRAPPER */}
      <div
        className="
          mx-auto
          w-full
          max-w-md
          px-2
          pb-2
        "
      >

        {/* NAV */}
        <div
          className="
            bg-white/95
            backdrop-blur-md
            border
            border-slate-200
            rounded-2xl
            shadow-[0_-4px_20px_rgba(0,0,0,0.08)]
            flex
            justify-between
            items-center
            py-1.5
          "
        >

          {navItems.map(
            ({
              to,
              label,
              Icon,
            }) => (

              <NavLink
                key={to}
                to={to}
                end
                className={({ isActive }) =>
                  `
                    flex-1
                    flex
                    flex-col
                    items-center
                    justify-center
                    gap-1
                    py-1
                    transition-all
                    duration-200
                    ${
                      isActive
                        ? "text-green-600"
                        : "text-slate-500"
                    }
                  `
                }
              >

                {({ isActive }) => (

                  <>

                    {/* ICON */}
                    <div
                      className={`
                        w-9
                        h-9
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        transition-all
                        duration-200
                        ${
                          isActive
                            ? "bg-green-600 text-white scale-105"
                            : "bg-transparent text-slate-500"
                        }
                      `}
                    >

                      <Icon className="w-[18px] h-[18px]" />

                    </div>

                    {/* LABEL */}
                    <span
                      className="
                        text-[10px]
                        font-semibold
                        leading-none
                        truncate
                      "
                    >
                      {label}
                    </span>

                  </>

                )}

              </NavLink>

            )
          )}

        </div>

        {/* SAFE AREA */}
        <div
          style={{
            height: "env(safe-area-inset-bottom)",
          }}
        />

      </div>

    </nav>

  );
}