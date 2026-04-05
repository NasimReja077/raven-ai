
// src/features/auth/api/auth.api.js
// API layer / service layer

import api from "../../../lib/axios.instance";

export const authApi = {
     signup: (d) => api.post("/auth/signup", d), // d = data (name, email, password)
     login: (d) => api.post("/auth/login", d),
     logout: () => api.post("/auth/logout"),
     verifyOTP: (d) => api.post("/auth/verify-otp", d),
     resendOTP: (d) => api.post("/auth/resend-otp", d),
     forgotPassword: (d) => api.post("/auth/forgot-password", d),
     resetPassword: (token, d) => api.post(`/auth/reset-password/${token}`, d),
     getMe: () => api.get("/auth/me"),
     refreshToken: () => api.post("/auth/refresh-token"),
};
