// src/lib/axios.instance.js

import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // send refreshToken cookie
  timeout: 20000,
});

// ── Request interceptor: attach access token from memory
axiosInstance.interceptors.request.use(
  (config) => {
    const token = window.__accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err),
);


// ── Response interceptor: auto-refresh on 401
let _refreshing = false;
let _queue = [];

const processQueue = (err, token) => {
  _queue.forEach((p) => (err ? p.reject(err) : p.resolve(token)));
  _queue = [];
};


axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const orig = err.config;
    if (err.response?.status !== 401 || orig._retry) {
      // Surface error message as toast for non-auth errors
      if (err.response?.status >= 500) {
        toast.error(err.response?.data?.message || "Server error");
      }
      return Promise.reject(err);
    }

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
        { withCredentials: true },
      );
      const newToken = data.accessToken;
      window.__accessToken = newToken;
      processQueue(null, newToken);
      orig.headers.Authorization = `Bearer ${newToken}`;
      return axiosInstance(orig);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      window.__accessToken = null;
      window.location.href = "/login";
      return Promise.reject(refreshErr);
    } finally {
      _refreshing = false;
    }
  },
);

export default axiosInstance;
