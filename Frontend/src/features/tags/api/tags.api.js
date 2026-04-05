// src/features/tags/api/tags.api.js 

import api from "../../../lib/axios.instance";

export const tagsApi = {
     getAll: (params) => api.get("/tags", { params }),
     getById: (id) => api.get(`/tags/${id}`),
     create: (d) => api.post("/tags", d),
     update: (id, d) => api.patch(`/tags/${id}`, d),
     remove: (id) => api.delete(`/tags/${id}`),
     archive: (id, d) => api.patch(`/tags/${id}/archive`, d),
     getSaves: (id, p) => api.get(`/tags/${id}/saves`, { params: p }),
     addToSave: (id, sId) => api.post(`/tags/${id}/saves/${sId}`),
     removeFromSave: (id, sId) => api.delete(`/tags/${id}/saves/${sId}`),
};