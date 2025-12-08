import React, { useState } from "react";

/**
 * PlayerAvatar
 * - src : url de la photo (peut être null/undefined)
 * - alt : texte alternatif
 * - size : nombre (32, 48, 64...) ou string "w-8 h-8" si tu veux utiliser tailwind classes (ici on accepte number)
 * - className : classes additionnelles
 * - onClick : callback facultatif
 *
 * Important : fixe la largeur/hauteur CSS (px) pour empêcher le "tremblement".
 */
export default function PlayerAvatar({ src, alt = "Joueur", size = 32, className = "", onClick }) {
  const [broken, setBroken] = useState(!src);
  const px = typeof size === "number" ? size : Number(size) || 32;

  // Placeholder inline SVG (petit avatar neutre) — évite le rechargement d'une image distante
  const svgPlaceholder = `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23818cf8' stroke-width='1.2'><circle cx='12' cy='8' r='3.2' /><path d='M4 20c1.8-3 5.2-5 8-5s6.2 2 8 5' /></svg>`
  )}`;

  const displaySrc = broken ? svgPlaceholder : src || svgPlaceholder;

  return (
    <img
      src={displaySrc}
      alt={alt}
      width={px}
      height={px}
      // classes : rounded + object-cover to keep consistent crop
      className={`rounded-full object-cover ring-1 ring-gray-200 shrink-0 ${className}`}
      style={{
        width: px,
        height: px,
        minWidth: px,
        minHeight: px,
        display: "inline-block",
        backgroundColor: "transparent",
      }}
      onError={(e) => {
        // replace with svg placeholder once, avoid infinite loops
        if (!broken) {
          setBroken(true);
          e.currentTarget.src = svgPlaceholder;
        }
      }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (ev) => {
              if (ev.key === "Enter" || ev.key === " ") onClick();
            }
          : undefined
      }
      title={alt}
    />
  );
}
