import { useEffect, useState, useRef } from "react";
import { logImpression, logClick } from "./adsService";

const BASE_URL = "http://localhost:8000";

const AdBanner = ({ ad }) => {
  const [format, setFormat] = useState("landscape");

  const ref = useRef(null);
  const lastSeenRef = useRef({});

  const getMediaUrl = (url) => {
    if (!url) return null;
    return url.startsWith("http") ? url : BASE_URL + url;
  };

  useEffect(() => {
    if (!ad) return;

    // 🔍 Détection format image (seulement si image existe)
    if (ad?.image) {
      const img = new Image();
      img.src = getMediaUrl(ad.image);

      img.onload = () => {
        const ratio = img.width / img.height;
        setFormat(ratio > 1.4 ? "landscape" : "other");
      };
    }

    // 👁️ Impression intelligente
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const now = Date.now();
          const lastSeen = lastSeenRef.current[ad.ad_id] || 0;

          if (now - lastSeen > 15000) {
            logImpression(ad.ad_id);
            lastSeenRef.current[ad.ad_id] = now;
          }
        });
      },
      { threshold: 0.6 }
    );

    if (ref.current) observer.observe(ref.current);

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, [ad]);

  const handleClick = () => {
    if (!ad) return;

    logClick(ad.ad_id);

    if (ad.link) {
      window.open(ad.link, "_blank");
    }
  };

  if (!ad) return null;

  const imageSrc = getMediaUrl(ad.image);
  const videoSrc = getMediaUrl(ad.video);

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className="relative my-4 rounded-2xl overflow-hidden cursor-pointer group"
    >
      {/* 🎯 MEDIA */}
      <div className="relative w-full h-32 sm:h-36 md:h-40 overflow-hidden">
        
        {/* 🔥 BACKGROUND */}
        {videoSrc ? (
          <video
            src={videoSrc}
            className="absolute inset-0 w-full h-full object-cover opacity-20"
            muted
            autoPlay
            loop
            playsInline
          />
        ) : (
          <img
            src={imageSrc}
            className="absolute inset-0 w-full h-full object-cover blur-md opacity-20"
            alt=""
          />
        )}

        {/* 🔥 CONTENU PRINCIPAL */}
        <div className="relative w-full h-full flex items-center justify-center">
          {videoSrc ? (
            <video
              src={videoSrc}
              className="h-full object-contain"
              muted
              autoPlay
              loop
              playsInline
            />
          ) : (
            <img
              src={imageSrc}
              alt={ad.title}
              className="h-full object-contain"
            />
          )}
        </div>
      </div>

      {/* 🎨 OVERLAY */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />

      {/* 🏷️ BADGE */}
      <span className="absolute top-2 left-2 bg-white/90 text-black text-xs px-2 py-1 rounded-md font-medium">
        Sponsorisé
      </span>

      {/* 📢 CONTENU */}
      <div className="absolute inset-0 flex items-end justify-between px-3 pb-2">
        <div className="text-white font-semibold text-sm sm:text-base drop-shadow-lg">
          {ad.title || "Découvrez notre partenaire"}
        </div>

        <button
          onClick={(e) => e.stopPropagation()}
          className="bg-white/95 backdrop-blur text-black px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow hover:bg-gray-200 transition"
        >
          Découvrir
        </button>
      </div>
    </div>
  );
};

export default AdBanner;