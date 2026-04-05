// ─── src/features/graph/api/graph.api.js

import api from "../../../lib/axios.instance";
export const graphApi = {
     get: () => api.get("/graph")
};