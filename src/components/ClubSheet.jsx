// src/components/ClubSheet.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../api/client";

/**
 * Hook API identique à usePlayerSheet :
 *   const { openSheet } = useClubSheet();
 *   openSheet(clubId)
 *
 * Implémentation légère basée sur un CustomEvent global.
 */
export function useClubSheet() {
  return {
    openSheet: (id) => {
      window.dispatchEvent(new CustomEvent("clubsheet:open", { detail: id }));
    },
    closeSheet: () => {
      window.dispatchEvent(new CustomEvent("clubsheet:close"));
    },
  };
}

/** Hôte à rendre une seule fois (ex. dans App.jsx) */
export function ClubSheetHost() {
  const [open, setOpen] = useState(false);
  const [clubId, setClubId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [club, setClub] = useState(null);

  // Écoute les ordres d’ouverture/fermeture
  useEffect(() => {
    const onOpen = (e) => {
      const id = e.detail;
      if (!id) return;
      setClub(null);
      setClubId(id);
      setOpen(true);
    };
    const onClose = () => setOpen(false);
    window.addEventListener("clubsheet:open", onOpen);
    window.addEventListener("clubsheet:close", onClose);
    return () => {
      window.removeEventListener("clubsheet:open", onOpen);
      window.removeEventListener("clubsheet:close", onClose);
    };
  }, []);

  // Charge les infos club quand ouvert
  useEffect(() => {
    let stop = false;
    if (!open || !clubId) return;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`clubs/${clubId}/`);
        if (!stop) setClub(data);
      } catch {
        if (!stop) setClub({ error: "Impossible de charger le club." });
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [open, clubId]);

  const close = () => setOpen(false);

  if (!open) return null;

  // Portail modal simple
  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={close}
      />

      {/* Sheet / Modal */}
      <div className="relative w-full sm:max-w-xl bg-white rounded-t-2xl sm:rounded-2xl shadow-lg ring-1 ring-black/10 p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">Fiche club</h2>
          <button
            className="rounded-md p-1.5 hover:bg-gray-100"
            onClick={close}
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Chargement…</div>
        ) : club?.error ? (
          <div className="py-8 text-center text-red-600">{club.error}</div>
        ) : club ? (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={
                  club.logo_url ||
                  club.logo ||
                  club.image ||
                  club.badge ||
                  club.crest ||
                  "/club-placeholder.png"
                }
                alt={club.name || "Club"}
                className="w-14 h-14 rounded-md object-contain ring-1 ring-black/5 bg-white"
                onError={(e) => (e.currentTarget.src = "/club-placeholder.png")}
              />
              <div>
                <div className="text-base font-semibold">
                  {club.name || club.title || club.short_name || "Club"}
                </div>
                <div className="text-sm text-gray-500">
                  {club.city || club.location || ""}
                </div>
              </div>
            </div>

            {/* Infos principales */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {club.stadium && (
                <div className="p-3 rounded-xl ring-1 ring-gray-100 bg-gray-50">
                  <div className="text-gray-500">Stade</div>
                  <div className="font-medium">{club.stadium}</div>
                </div>
              )}
              {club.coach && (
                <div className="p-3 rounded-xl ring-1 ring-gray-100 bg-gray-50">
                  <div className="text-gray-500">Coach</div>
                  <div className="font-medium">{club.coach}</div>
                </div>
              )}
              {Number.isFinite(Number(club.founded)) && (
                <div className="p-3 rounded-xl ring-1 ring-gray-100 bg-gray-50">
                  <div className="text-gray-500">Fondé</div>
                  <div className="font-medium">{club.founded}</div>
                </div>
              )}
              {club.website && (
                <div className="p-3 rounded-xl ring-1 ring-gray-100 bg-gray-50">
                  <div className="text-gray-500">Site</div>
                  <a
                    className="font-medium text-blue-600 hover:underline break-all"
                    href={club.website}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {club.website}
                  </a>
                </div>
              )}
            </div>

            {/* Description si dispo */}
            {club.about && (
              <p className="text-sm text-gray-700 whitespace-pre-line">{club.about}</p>
            )}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
