// src/features/user/api/user.api.js
import api from "../../../lib/axios.instance";

export const userApi = {
     getProfile: () => api.get("/users/profile"),
     updateProfile: (d) => api.put("/users/profile", d),
     updatePassword: (d) => api.put("/users/password", d),
     uploadAvatar: (fd) =>
          api.post("/users/avatar", fd, {
               headers: { "Content-Type": "multipart/form-data" },
          }),
     getPublicProfile: (uid) => api.get(`/users/profile/${uid}`),
};
