
// AUTH SLICE  src/features/auth/store/auth.slice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authApi } from "../api/auth.api";
import { queryClient } from "../../../lib/queryClient";

export const fetchMe = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => { // _ no argument
    try {
      const { data } = await authApi.getMe(); // current user fetch
      return data.data.user;
    } catch (e) {
      return rejectWithValue(e.response?.data); // rejectWithValue - custom error return
    }
  },
);

export const logoutThunk = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authApi.logout();
      window.__accessToken = null; // Delete the token from memory.
      queryClient.clear(); // React Query cache clear
    } catch (e) {
      return rejectWithValue(e.response?.data);
    }
  },
);

const authSlice = createSlice({
  name: "auth",

  initialState: {
    user: null,
    isLoading: true,
    isAuthenticated: false,
  },


  reducers: {
    setUser: (s, { payload }) => { // setUser - action reducer function // s = state (current Redux state)
      s.user = payload;
      s.isAuthenticated = !!payload;
      s.isLoading = false;
    },
    setToken: (_, { payload }) => {
      window.__accessToken = payload;
    },
    clearAuth: (s) => {
      s.user = null;
      s.isAuthenticated = false;
      s.isLoading = false;
      window.__accessToken = null;
    },
  },

  extraReducers: (b) => { // b = builder object
    b.addCase(fetchMe.pending, (s) => {
      s.isLoading = true;
    })
          // Thunk 3 states
      .addCase(fetchMe.fulfilled, (s, { payload }) => {
        s.user = payload;
        s.isAuthenticated = true;
        s.isLoading = false;
      })
      .addCase(fetchMe.rejected, (s) => {
        s.isLoading = false;
        s.isAuthenticated = false;
      })
      .addCase(logoutThunk.fulfilled, (s) => {
        s.user = null;
        s.isAuthenticated = false;
      });
  },


});

export const { setUser, setToken, clearAuth } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectUser = (s) => s.auth.user;
export const selectIsAuth = (s) => s.auth.isAuthenticated;
export const selectAuthLoading = (s) => s.auth.isLoading;
