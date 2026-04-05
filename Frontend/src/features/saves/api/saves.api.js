// ─── src/features/saves/api/saves.api.js 

import api from "../../../lib/axios.instance";

export const savesApi = {

     getAll: (params) => api.get(
          "/saves", {
          params
     }),

     getById: (id) => api.get(`/saves/${id}`),

     create: (d) => api.post("/saves", d),

     update: (id, d) => api.patch(`/saves/${id}`, d),
     remove: (id) => api.delete(`/saves/${id}`),
     getStats: () => api.get("/saves/stats"),
     getResurface: (count) => api.get(
          "/saves/resurface",
          {
               params: { count }
          }
     ),
     getRelated: (id) => api.get(`/saves/${id}/related`),
     getSimilar: (id) => api.get(`/saves/${id}/similar`),
     reprocess: (id, d) => api.post(`/saves/${id}/reprocess`, d),

     // Highlights
     addHighlight: (id, d) => api.post(`/saves/${id}/highlights`, d),

     delHighlight: (id, hId) => api.delete(`/saves/${id}/highlights/${hId}`),

     // Collections
     addToCollection: (id, d) => api.post(`/saves/${id}/collections`, d),

     removeFromColl: (id, cId) => api.delete(`/saves/${id}/collections/${cId}`),

     // File upload
     uploadFile: (fd) => api.post("/saves/uploadFile", fd, {
          headers: {
               "Content-Type": "multipart/form-data"
          },
     }),

     deleteFile: (id) => api.delete(`/saves/${id}/file`),
};
