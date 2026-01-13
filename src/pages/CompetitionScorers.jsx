import { useParams } from "react-router-dom";

export default function CompetitionScorers() {
  const { id } = useParams();

  return (
    <div className="bg-white rounded-xl p-4 shadow">
      <h2 className="text-lg font-semibold mb-2">
        Buteurs – Compétition {id}
      </h2>

      <p className="text-gray-500">
        Liste des buteurs à venir…
      </p>
    </div>
  );
}
