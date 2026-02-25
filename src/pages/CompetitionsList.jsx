import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, ChevronRight } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function CompetitionsList() {
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/competitions/`)
      .then(res => res.json())
      .then(data => {
        setCompetitions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-gray-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pb-24">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-2.5 rounded-lg shadow">
          <Trophy className="text-white" size={18} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Compétitions
          </h1>
          <p className="text-xs text-gray-500">
            Championnats disponibles
          </p>
        </div>
      </div>

      {/* LISTE */}
      <div className="space-y-2">
        {competitions.map(comp => (
          <Link
            key={comp.id}
            to={`/competitions/${comp.id}`}
            className="group no-underline bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm hover:shadow-md transition flex items-center justify-between"
          >
            <div className="flex items-center gap-3">

              {/* LOGO */}
              <div className="w-9 h-9 rounded-md bg-gray-100 overflow-hidden flex items-center justify-center">
                {comp.logo ? (
                  <img
                    src={comp.logo}
                    alt={comp.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Trophy size={14} className="text-gray-400" />
                )}
              </div>

              {/* INFOS */}
              <div>
                <h2 className="text-sm font-semibold text-gray-800 group-hover:text-yellow-600 transition no-underline">
                  {comp.name}
                </h2>
                {comp.season && (
                  <p className="text-xs text-gray-500">
                    {comp.season}
                  </p>
                )}
              </div>
            </div>

            <ChevronRight
              size={16}
              className="text-gray-400 group-hover:text-yellow-500 transition"
            />
          </Link>
        ))}
      </div>
    </div>
  );
}