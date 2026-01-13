// src/pages/Competitions.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_BASE_URL;

export default function Competitions() {
  const [competitions, setCompetitions] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/competitions/`)
      .then(res => res.json())
      .then(setCompetitions);
  }, []);

  return (
    <div className="space-y-3">
      {competitions.map(c => (
        <Link
          key={c.id}
          to={`/competitions/${c.id}`}
          className="block bg-white p-4 rounded-xl shadow"
        >
          {c.name}
        </Link>
      ))}
    </div>
  );
}
