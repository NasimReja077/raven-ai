// src/App.jsx
//
// FIX: Page refresh logout bug.
// Problem: On refresh, window.__accessToken is wiped (it's in memory).
// Bootstrap called fetchMe() → 401 → auth.slice set isAuthenticated=false → redirect to /login.
// The axios interceptor *did* try to refresh, but fetchMe() had already rejected by then.
//
// Solution: Bootstrap first calls refreshToken() to restore the access token into memory,
// THEN calls fetchMe() to populate the Redux store. If refresh fails → user truly not logged in.

import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { store } from "./app/store";
import { queryClient } from "./lib/queryClient";
import { router } from "./router";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchMe, setToken } from "./features/auth/store/auth.slice";
import { authApi } from "./features/auth/api/auth.api";
import SplashScreen from "./components/common/SplashScreen.jsx";

function Bootstrap({ children }) {
  const dispatch = useDispatch();
  const [splashDone, setSplashDone] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Step 1: Try to silently restore access token from refresh cookie
      try {
        const { data } = await authApi.refreshToken();
        if (data?.accessToken) {
          dispatch(setToken(data.accessToken));
        }
      } catch {
        // No valid refresh token → user not logged in → that's fine
      }

      // Step 2: Now fetch the current user (access token is in memory if refresh worked)
      await dispatch(fetchMe());
    };

    init();
  }, [dispatch]);

  // Show splash for minimum 1.8s (brand moment), then hand off
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