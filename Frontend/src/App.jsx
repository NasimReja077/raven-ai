// ─── src/App.jsx ──────────────────────────────────────────────────────────────
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { store } from "./app/store";
import { queryClient } from "./lib/queryClient";
import { router } from "./router";
import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { fetchMe, setToken } from "./features/auth/store/auth.slice";

// Bootstrap: fetch current user on app load
function Bootstrap({ children }) {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchMe());
  }, [dispatch]);
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
