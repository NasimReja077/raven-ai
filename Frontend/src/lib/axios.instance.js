// src/lib/axios.instance.js
//
// FIX: The original code would enter an infinite redirect loop when:
//   1. App opens with no refresh-token cookie
//   2. fetchMe() → 401
//   3. Interceptor tries to call /auth/refresh-token
//   4. Refresh → 401 (no cookie)
//   5. Catch block calls window.location.href = '/login'
//   6. App remounts → back to step 1
//
// The fix:
//   • Skip the refresh retry for any /auth/ endpoint
//   • Only hard-redirect if we're NOT already on /login or /signup
//   • Use a more robust "already refreshing" guard

import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 20000,
});

// ── Request: attach access token from memory ──────────────────────────────────
axiosInstance.interceptors.request.use(
  (config) => {
    const token = window.__accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response: auto-refresh on 401 ────────────────────────────────────────────
let _refreshing = false;
let _queue = [];

const processQueue = (err, token) => {
  _queue.forEach((p) => (err ? p.reject(err) : p.resolve(token)));
  _queue = [];
};

const AUTH_PATHS = ["/auth/login", "/auth/signup", "/auth/refresh-token", "/auth/verify-otp", "/auth/resend-otp", "/auth/forgot-password", "/auth/reset-password"];
const isAuthPath = (url = "") => AUTH_PATHS.some((p) => url.includes(p));
const isOnAuthPage = () => ["/login", "/signup", "/verify-otp", "/forgot-password", "/reset-password"].some((p) => window.location.pathname.startsWith(p));

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;

    // Surface 5xx errors as toasts
    if (err.response?.status >= 500) {
      toast.error(err.response?.data?.message || "Server error");
    }

    // ── FIX: Don't try to refresh for auth endpoints or already-retried requests
    if (
      err.response?.status !== 401 ||
      orig._retry ||
      isAuthPath(orig.url)
    ) {
      return Promise.reject(err);
    }

    // If already refreshing, queue this request
    if (_refreshing) {
      return new Promise((resolve, reject) => {
        _queue.push({ resolve, reject });
      }).then((token) => {
        orig.headers.Authorization = `Bearer ${token}`;
        return axiosInstance(orig);
      });
    }

    orig._retry = true;
    _refreshing = true;

    try {
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh-token`,
        {},
        { withCredentials: true }
      );
      const newToken = data.accessToken;
      window.__accessToken = newToken;
      processQueue(null, newToken);
      orig.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(orig);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      window.__accessToken = null;
      // ── FIX: Only hard-redirect if we're not already on an auth page
      //    This stops the redirect loop when the app first opens unauthenticated
      if (!isOnAuthPage()) {
        window.location.href = "/login";
      }
      return Promise.reject(refreshErr);
    } finally {
      _refreshing = false;
    }
  }
);

export default axiosInstance;