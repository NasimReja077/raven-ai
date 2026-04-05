// src/features/auth/store/auth.slice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "../api/auth.api";
import { queryClient } from "../../../lib/queryClient";

// ── Thunks 
export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authApi.getMe();
      return data.data.user;
    } catch (e) {
      return rejectWithValue(e.response?.data);
    }
  },
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      window.__accessToken = null;
      queryClient.clear();
    } catch (e) {
      // Always clear locally even if API fails
      window.__accessToken = null;
      queryClient.clear();
      return rejectWithValue(e.response?.data);
    }
  },
);

// ── Slice
const authSlice = createSlice({
  name: "auth",

  initialState: {
    user: null,
    isAuthenticated: false,
    isLoading: true,
  },

  reducers: {
    setUser: (state, { payload }) => {
      state.user = payload;
      state.isAuthenticated = !!payload;
      state.isLoading = false;
    },
    setToken: (_, { payload }) => {
      window.__accessToken = payload;
    },
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      window.__accessToken = null;
    },
  },

  extraReducers: (builder) => {
    builder
      // fetchMe
      .addCase(fetchMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMe.fulfilled, (state, { payload }) => {
        state.user = payload;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      .addCase(fetchMe.rejected, (state) => {
        // Not logged in — that's fine, just stop loading
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })

      // logout
      .addCase(logoutThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      .addCase(logoutThunk.rejected, (state) => {
        // Force clear even on error
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { setUser, setToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectUser = (s) => s.auth.user;
export const selectIsAuth = (s) => s.auth.isAuthenticated;
export const selectAuthLoading = (s) => s.auth.isLoading;
