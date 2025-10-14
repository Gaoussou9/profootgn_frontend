// src/components/StaffSheet.jsx
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import api from "../api/client";

/** Hook d’ouverture / fermeture de la fiche staff */
export function useStaffSheet() {
  return {
    openSheet: (id) => window.dispatchEvent(new CustomEvent("staffsheet:open", { detail: id })),
    closeSheet: () => window.dispatchEvent(new CustomEvent("staffsheet:close")),
  };
}

/** Hôte global à monter UNE SEULE FOIS (ex. dans App.jsx) */
export function StaffSheetHost() {
  const [open, setOpen] = useState(false);
  const [staffId, setStaffId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [staff, setStaff] = useState(null);

  // Écoute les commandes globales
  useEffect(() => {
    const onOpen = (e) => { setStaff(null); setStaffId(e.detail); setOpen(true); };
    const onClose = () => setOpen(false);
    window.addEventListener("staffsheet:open", onOpen);
    window.addEventListener("staffsheet:close", onClose);
    return () => {
      window.removeEventListener("staffsheet:open", onOpen);
      window.removeEventListener("staffsheet:close", onClose);
    };
  }, []);

  // Charge la fiche staff
  useEffect(() => {
    let stop = false;
    if (!open || !staffId) return;
    (async () => {
      setLoading(true);
      try {
        // Essaie l’endpoint public, sinon fallback admin
        let res;
        try {
          res = await api.get(`staff/${staffId}/`);
        } catch {
          res = await api.get(`/admin/staff/${staffId}/`);
        }
        if (!stop) setStaff(res.data || {});
      } catch {
        if (!stop) setStaff({ error: "Impossible de charger ce membre du staff." });
      } finally {
        if (!stop) setLoading(false);
      }
    })();
    return () => { stop = true; };
  }, [open, staffId]);

  if (!open) return null;
  const close = () => setOpen(false);

  const name =
    staff?.full_name ||
    staff?.name ||
    [staff?.first_name, staff?.last_name].filter(Boolean).join(" ") ||
    "Staff";

  const role = staff?.role_display || staff?.role || staff?.title || "";
  const photo = staff?.photo || staff?.avatar || staff?.image || null;
  const club = staff?.club_name || staff?.club?.name || "";
  const phone = staff?.phone || "";
  const email = staff?.email || "";
  const since = staff?.since || staff?.since_year || "";
  const about = staff?.bio || staff?.about || "";

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center" role="dialog" aria-modal="true">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40" onClick={close} />

      {/* Sheet */}
      <div className="relative w-full sm:max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-lg ring-1 ring-black/10 p-4 sm:p-6">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold">Fiche staff</h2>
          <button className="rounded-md p-1.5 hover:bg-gray-100" onClick={close} aria-label="Fermer">✕</button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Chargement…</div>
        ) : staff?.error ? (
          <div className="py-8 text-center text-red-600">{staff.error}</div>
        ) : (
          <div className="mt-4 space-y-4">
            {/* En-tête */}
            <div className="flex items-center gap-3">
              <img
                src={photo || "/player-placeholder.png"}
                alt={name}
                className="w-14 h-14 rounded-full object-cover ring-1 ring-gray-200"
                onError={(e) => (e.currentTarget.src = "/player-placeholder.png")}
              />
              <div>
                <div className="text-base font-semibold">{name}</div>
                <div className="text-sm text-gray-500">{role}</div>
                {club && <div className="text-xs text-gray-500">{club}</div>}
              </div>
            </div>

            {/* Infos rapides */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {since && (
                <div className="p-3 rounded-xl ring-1 ring-gray-100 bg-gray-50">
                  <div className="text-gray-500">En poste depuis</div>
                  <div className="font-medium">{since}</div>
                </div>
              )}
              {phone && (
                <div className="p-3 rounded-xl ring-1 ring-gray-100 bg-gray-50">
                  <div className="text-gray-500">Téléphone</div>
                  <a href={`tel:${phone}`} className="font-medium text-blue-600 hover:underline">{phone}</a>
                </div>
              )}
              {email && (
                <div className="p-3 rounded-xl ring-1 ring-gray-100 bg-gray-50">
                  <div className="text-gray-500">Email</div>
                  <a href={`mailto:${email}`} className="font-medium text-blue-600 hover:underline break-all">{email}</a>
                </div>
              )}
            </div>

            {/* Bio / notes */}
            {about && <p className="text-sm text-gray-700 whitespace-pre-line">{about}</p>}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
