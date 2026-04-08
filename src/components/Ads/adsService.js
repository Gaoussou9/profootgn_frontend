const API_URL = import.meta.env.VITE_API_URL + "/api/ads";

export const fetchAds = async (params = {}) => {
  const cleanParams = Object.fromEntries(
  Object.entries(params).filter(
    ([_, value]) => value !== undefined && value !== null
  )
);

const query = new URLSearchParams(cleanParams).toString();

  const res = await fetch(`${BASE_URL}/api/ads/?${query}`);

  if (!res.ok) {
    throw new Error("Erreur fetch ads");
  }

  return res.json();
};

export const logImpression = async (ad_id) => {
  try {
    await fetch(`${BASE_URL}/api/ads/impression/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ad_id }),
    });
  } catch (err) {
    console.error("Impression error:", err);
  }
};

export const logClick = async (ad_id) => {
  try {
    await fetch(`${BASE_URL}/api/ads/click/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ad_id }),
    });
  } catch (err) {
    console.error("Click error:", err);
  }
};