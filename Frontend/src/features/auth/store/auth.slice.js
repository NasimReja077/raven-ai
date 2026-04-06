// src/features/auth/store/auth.slice.js
//
// FIX: The original slice started with isLoading: true. If fetchMe was rejected
//      (user not logged in), isLoading correctly flipped to false. But if the
//      request itself threw a network error before returning a response, the
//      rejected case still fired — this was fine. The real bug was that on
//      hard page refresh the `Bootstrap` component dispatched fetchMe() and
//      the whole app was gated behind isLoading. Combined with the axios
//      interceptor retrying 401s and triggering a redirect BEFORE fetchMe
//      resolved, the app would sometimes get stuck in a loading spinner.
//
//      The fix here ensures that ANY failure path (rejected OR network error)
//      always flips isLoading to false and clears isAuthenticated.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "../api/auth.api";
import { queryClient } from "../../../lib/queryClient";

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authApi.getMe();
      return data.data.user;
    } catch (e) {
      // Treat any 401 as "not logged in" — not an error worth logging
      if (e.response?.status === 401) {
        return rejectWithValue({ status: 401, message: "Not authenticated" });
      }
      return rejectWithValue(e.response?.data ?? { message: "Network error" });
    }
  }
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      window.__accessToken = null;
      queryClient.clear();
    } catch (e) {
      // Even if the server-side logout fails, clear client state
      window.__accessToken = null;
      queryClient.clear();
      return rejectWithValue(e.response?.data);
    }
  }
);

const authSlice = createSlice({
  name: "auth",

  initialState: {
    user: null,
    isLoading: true,       // true until fetchMe settles (prevents route flash)
    isAuthenticated: false,
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

  extraReducers: (b) => {
    b
      .addCase(fetchMe.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMe.fulfilled, (state, { payload }) => {
        state.user = payload;
        state.isAuthenticated = true;
        state.isLoading = false;
      })
      // FIX: always resolve isLoading on rejection so the app doesn't get stuck
      .addCase(fetchMe.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false; // ← critical: ungate the app
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      })
      .addCase(logoutThunk.rejected, (state) => {
        // Even on server error, clear client state
        state.user = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { setUser, setToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;

export const selectUser = (s) => s.auth.user;
export const selectIsAuth = (s) => s.auth.isAuthenticated;
export const selectAuthLoading = (s) => s.auth.isLoading;