//  src/features/clusters/api/clusters.api.js

import api from "../../../lib/axios.instance";

export const clustersApi = {
     getAll: () => api.get("/clusters"),

     getSaves: (id, p) => api.get(`/clusters/${id}/saves`, 
          { params: p }
     ),
     runKMeans: (d) => api.post("/clusters/run", d),

     runDBSCAN: (d) => api.post("/clusters/dbscan", d),
     
     suggest: () => api.get("/clusters/dbscan/suggest"),
};
