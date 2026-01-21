import { NavLink, useMatch } from "react-router-dom";
import { FaFutbol, FaChartBar, FaUsers } from "react-icons/fa";
import { GiGoalKeeper } from "react-icons/gi";
import { FaRegHandshake } from "react-icons/fa";

export default function CompetitionNav() {
  // Match toutes les routes /competitions/:id/*
  const match = useMatch("/competitions/:id/*");

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow md:hidden">
      <div className="max-w-4xl mx-auto flex justify-between px-4 py-2">
        {items.map(({ to, label, Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 text-[11px] transition ${
                isActive
                  ? "text-blue-600 font-semibold"
                  : "text-gray-500"
              }`
            }
          >
            <Icon className="text-lg" />
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
