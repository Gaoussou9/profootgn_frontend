// src/utils/fetchAllPages.js
import api from "../api/client";

/**
 * Récupère toutes les pages d'un endpoint paginé Django REST Framework
 * - initialUrl : url relative ou absolute (ex: '/api/players/?club=16')
 * - opts : options passées à axios (ex: { params: {...} })
 *
 * Utilise l'instance `api` (axios) pour garder baseURL / cookies / auth.
 */
export async function fetchAllPagesAxios(initialUrl, opts = {}) {
  const accumulated = [];
  let next = initialUrl;
  console.log("[fetchAllPagesAxios] start", initialUrl);

  // helper: si next est une URL absolue sur la même origine, on la transforme en relative
  function toRelative(url) {
    try {
      const u = new URL(url, window.location.origin);
      // si même origine -> renvoyer pathname+search
      if (u.origin === window.location.origin) {
        return u.pathname + u.search;
      }
      // sinon renvoyer l'URL absolue (axios peut la supporter aussi)
      return url;
    } catch (e) {
      // si URL relative déjà -> la renvoyer telle quelle
      return url;
    }
  }

  while (next) {
    const urlForAxios = toRelative(next);
    console.log("[fetchAllPagesAxios] fetching", urlForAxios);
    // note : on passe opts ici (ex: { params: { page_size: 100 } })
    const resp = await api.get(urlForAxios, opts);
    if (!resp || resp.status >= 400) {
      console.error("[fetchAllPagesAxios] bad response", resp && resp.status);
      throw new Error("fetchAllPagesAxios: request failed");
    }
    const data = resp.data;

    if (Array.isArray(data)) {
      console.log("[fetchAllPagesAxios] got array length=", data.length);
      return data;
    }

    if (data.results) {
      console.log("[fetchAllPagesAxios] page length=", data.results.length, "next=", data.next);
      accumulated.push(...data.results);
      next = data.next;
      // if next is absolute same-origin, convert to relative for next loop
      if (next && next.startsWith(window.location.origin)) {
        next = toRelative(next);
      }
    } else {
      console.log("[fetchAllPagesAxios] unexpected shape, returning data");
      return data;
    }
  }

  console.log("[fetchAllPagesAxios] done total=", accumulated.length);
  return accumulated;
}

export default fetchAllPagesAxios;
