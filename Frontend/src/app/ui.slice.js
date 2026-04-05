
// UI SLICE  src/app/ui.slice.js  (sidebar open, search, active filters)

import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",

  initialState: {
    sidebarOpen: true,
    search: "",
    semantic: false,
    activeType: "all",
  },

  reducers: {
    toggleSidebar: (s) => {
      s.sidebarOpen = !s.sidebarOpen;
    },
    setSearch: (s, { payload }) => {
      s.search = payload;
    },
    setSemantic: (s, { payload }) => {
      s.semantic = payload;
    },
    setActiveType: (s, { payload }) => {
      s.activeType = payload;
    },
  },
});

export const { 
     toggleSidebar, setSearch, setSemantic, setActiveType 
 } = uiSlice.actions;

export default uiSlice.reducer;
