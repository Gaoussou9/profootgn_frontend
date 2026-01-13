import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

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
      .catch(err => {
        console.error("Erreur chargement compétitions", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Chargement des compétitions…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Compétitions</h1>

      {competitions.map(comp => (
        <Link
          key={comp.id}
          to={`/competitions/${comp.id}`}
          className="block bg-white rounded-xl p-4 shadow hover:bg-gray-50"
        >
          <div className="font-semibold">{comp.name}</div>
          <div className="text-xs text-gray-500">{comp.slug}</div>
        </Link>
      ))}
    </div>
  );
}
