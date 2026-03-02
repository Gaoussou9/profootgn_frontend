// src/components/SilkcoatAd.jsx
import React, { useEffect, useRef, useState } from "react";
import { API } from "../config";

export default function SilkcoatAd({
  adId = "silkcoat-home-1",
  imageUrl,
  videoUrl = null,
  linkUrl = null,
  size = "medium",
  className = ""
}) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  const [open, setOpen] = useState(false);

  const heightClass = "h-24 sm:h-28";

  const API_BASE = "https://api.kanousport.com";

  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;

    const markImpression = async () => {
      if (seen) return;
      setSeen(true);
      try {
        await fetch(`${API_BASE}/api/ads/impression/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ad_id: adId })
        });
      } catch (e) {
        console.warn("ad impression error", e);
      }
    };

    const obs = new IntersectionObserver(
      entries => entries.forEach(e => e.isIntersecting && markImpression()),
      { threshold: 0.5 }
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [adId, seen]);

  const handleClick = (e) => {
    e?.preventDefault?.();

    fetch(`${API_BASE}/api/ads/click/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ad_id: adId })
    }).catch(e => console.warn("ad click error", e));

    if (videoUrl) {
      setOpen(true);
      return;
    }

    if (linkUrl) window.open(linkUrl, "_blank");
  };

  return (
    <>
      <div ref={ref} className={`w-full ${className}`}>
        <div
          className={`relative rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-white ${heightClass}`}
          role="button"
          onClick={handleClick}
        >
          <div className="absolute left-3 top-0 z-20 px-2 py-0.5 text-xs rounded-full bg-black/80 text-white backdrop-blur-sm">
            Decouvrez les meilleures peintures
          </div>

          {(linkUrl || videoUrl) && (
            <div className="absolute right-3 bottom-3 z-20">
              <span className="inline-flex items-center gap-2 bg-white/90 text-sm px-3 py-1 rounded-full shadow-sm ring-1 ring-gray-200">
                Découvrir
              </span>
            </div>
          )}

          <img
            src={imageUrl}
            alt="Silkcoat - publicité"
            loading="lazy"
            className="w-full h-full object-contain bg-white"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/silkcoat-placeholder.jpg";
            }}
          />
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-lg overflow-hidden w-full max-w-3xl">
            <div className="flex items-center justify-between p-3 border-b">
              <h3 className="font-semibold">Silkcoat — Découvrir</h3>
              <button onClick={() => setOpen(false)} className="text-xl p-1">✕</button>
            </div>

            <div className="p-4">
              {videoUrl ? (
                videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be") ? (
                  <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
                    <iframe
                      title="Silkcoat video"
                      src={videoUrl + "?autoplay=1&rel=0"}
                      frameBorder="0"
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
                    />
                  </div>
                ) : (
                  <video src={videoUrl} controls autoPlay playsInline className="w-full rounded" />
                )
              ) : (
                <p>Vidéo non disponible.</p>
              )}

              {linkUrl && (
                <div className="mt-4 text-right">
                  <a href={linkUrl} target="_blank" rel="noreferrer" className="px-4 py-2 rounded bg-blue-600 text-white">
                    En savoir plus
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}