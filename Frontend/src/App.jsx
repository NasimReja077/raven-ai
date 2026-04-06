// src/App.jsx

import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { store } from "./app/store";
import { queryClient } from "./lib/queryClient";
import { router } from "./router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe, setToken, selectIsAuth } from "./features/auth/store/auth.slice";
import { authApi } from "./features/auth/api/auth.api";
import SplashScreen from "./components/common/SplashScreen";

// ── Extension token bridge ────────────────────────────────────────────────────
// Posts the current access token to the page so the Raven browser extension
// can pick it up via content.js without requiring the user to log in twice.
function bridgeTokenToExtension(token) {
  if (!token) return;
  try {
    window.postMessage({
      type:   "RAVEN_TOKEN",
      token,
      apiUrl: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
      appUrl: window.location.origin,
    }, window.location.origin);
  } catch {}
}

// ── Bootstrap — refresh token on startup
function Bootstrap({ children }) {
  const dispatch = useDispatch();
  const [splashDone, setSplashDone] = useState(false);
  const isAuth = useSelector(selectIsAuth);

  useEffect(() => {
    const init = async () => {
      try {
        const { data } = await authApi.refreshToken();
        if (data?.accessToken) {
          dispatch(setToken(data.accessToken));
          bridgeTokenToExtension(data.accessToken);
        }
      } catch {
        // No refresh cookie → not logged in
      }
      await dispatch(fetchMe());
    };
    init();
  }, [dispatch]);

  // Bridge token whenever auth state changes (e.g. after login)
  useEffect(() => {
    const token = window.__accessToken;
    if (isAuth && token) bridgeTokenToExtension(token);
  }, [isAuth]);

  // Minimum splash duration
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1800);
    return () => clearTimeout(t);
  }, []);

  if (!splashDone) return <SplashScreen />;
  return children;
}

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={200}>
          <Bootstrap>
            <RouterProvider router={router} />
          </Bootstrap>
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "hsl(var(--card))",
                color: "hsl(var(--card-foreground))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "10px",
                fontSize: "13px",
              },
            }}
          />
        </TooltipProvider>
      </QueryClientProvider>
    </Provider>
  );
}