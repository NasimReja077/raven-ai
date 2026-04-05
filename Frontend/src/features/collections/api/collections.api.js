// src/features/collections/api/collections.api.js

import api from "../../../lib/axios.instance";

export const collectionsApi = {
     getAll: (params) => api.get(
          "/collections", 
          { params }
     ),
     getById: (id) => api.get(`/collections/${id}`),
     create: (d) => api.post("/collections", d),
     update: (id, d) => api.patch(`/collections/${id}`, d),
     remove: (id) => api.delete(`/collections/${id}`),
     getSaves: (id, p) => api.get(`/collections/${id}/saves`, { params: p }),
     addSave: (id, d) => api.post(`/collections/${id}/saves`, d),
     removeSave: (id, sId) => api.delete(
          `/collections/${id}/saves/${sId}`
     ),
     reorder: (id, d) => api.patch(`/collections/${id}/reorder`, d),
};
