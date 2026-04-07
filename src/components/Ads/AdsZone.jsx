import { useEffect, useState } from "react";
import AdBanner from "./AdBanner";
import { fetchAds } from "./adsService";

const AdsZone = ({ page, competition_id, match_id, club_id, position }) => {
  const [ads, setAds] = useState([]);
  const [currentAd, setCurrentAd] = useState(null);

  useEffect(() => {
    fetchAds({
      page,
      position,
      competition_id,
      match_id,
      club_id,
    }).then(setAds);
  }, [page, position, competition_id, match_id, club_id]);

  // 🔥 fonction intelligente (pondération)
  const pickAd = (adsList) => {
    if (!adsList.length) return null;

    const weighted = [];

    adsList.forEach((ad) => {
      const weight = ad.priority || 1;

      for (let i = 0; i < weight; i++) {
        weighted.push(ad);
      }
    });

    return weighted[Math.floor(Math.random() * weighted.length)];
  };

  // 🔁 rotation automatique
  useEffect(() => {
    if (!ads.length) return;

    const updateAd = () => {
      const selected = pickAd(ads);
      setCurrentAd(selected);
    };

    updateAd(); // premier affichage

    const interval = setInterval(updateAd, 5000); // toutes les 5 secondes

    return () => clearInterval(interval);
  }, [ads]);

  if (!currentAd) return null;

  return <AdBanner ad={currentAd} />;
};

export default AdsZone;