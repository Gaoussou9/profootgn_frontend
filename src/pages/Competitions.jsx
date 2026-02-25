// src/pages/Competitions.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Trophy, ChevronRight } from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL;

export default function Competitions() {
  const [competitions, setCompetitions] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/competitions/`)
      .then(res => res.json())
      .then(setCompetitions);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 pb-24">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 p-6 rounded-b-3xl shadow-md">
        <div className="flex items-center gap-3">
          <Trophy className="text-white" size={28} />
          <div>
            <h1 className="text-white text-2xl font-bold">
              Compétitions
            </h1>
            <p className="text-white/90 text-sm">
              Championnats & tournois disponibles
            </p>
          </div>
        </div>
      </div>

      {/* LISTE DES COMPÉTITIONS */}
      <div className="px-4 mt-6 space-y-4">
        {competitions.map(c => (
          <Link
            key={c.id}
            to={`/competitions/${c.id}`}
            className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                {c.name}
              </h2>
              <p className="text-sm text-gray-500">
                {c.slug}
              </p>
            </div>

            <ChevronRight className="text-gray-400" />
          </Link>
        ))}
      </div>
    </div>
  );
}