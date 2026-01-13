import axios from "axios";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const fetchCompetitionMatches = async (competitionId) => {
  const response = await axios.get(
    `${API_BASE}/api/competitions/${competitionId}/matches/`
  );

  // ✅ EXTRACTION DU TABLEAU
  return response.data.matches;
};
