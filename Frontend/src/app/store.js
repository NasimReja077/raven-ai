// REDUX STORE  src/app/store.js
// ════════════════════════════════════════════════════════════════════════════
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/store/auth.slice";
import uiReducer   from "./ui.slice";

export const store = configureStore({
     reducer: { 
          auth: authReducer, 
          ui: uiReducer 
     },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});