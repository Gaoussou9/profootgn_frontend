import {
  NavLink,
  useMatch,
} from "react-router-dom";

import {
  FaFutbol,
  FaChartBar,
  FaUsers,
} from "react-icons/fa";

import { GiGoalKeeper } from "react-icons/gi";

import { FaRegHandshake } from "react-icons/fa";

export default function CompetitionNav() {

  // MATCH ROUTE
  const match = useMatch(
    "/competitions/:id/*"
  );

  if (!match) return null;

  const { id } = match.params;

  const items = [

    {
      to: `/competitions/${id}`,
      label: "Matchs",
      Icon: FaFutbol,
      exact: true,
    },

    {
      to: `/competitions/${id}/classement`,
      label: "Classement",
      Icon: FaChartBar,
    },

    {
      to: `/competitions/${id}/buteurs`,
      label: "Buteurs",
      Icon: GiGoalKeeper,
    },

    {
      to: `/competitions/${id}/clubs`,
      label: "Clubs",
      Icon: FaUsers,
    },

    {
      to: `/competitions/${id}/ligue1`,
      label: "Ligue 1",
      Icon: FaRegHandshake,
    },

  ];

  return (

    <nav
      className="
        fixed
        bottom-0
        left-0
        right-0
        z-[9999]
      "
      aria-label="Navigation compétition"
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

        {/* NAVBAR */}
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

          {items.map(
            ({
              to,
              label,
              Icon,
              exact,
            }) => (

              <NavLink
                key={to}
                to={to}
                end={exact}
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