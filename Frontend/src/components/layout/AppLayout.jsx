// src/components/layout/AppLayout.jsx

import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuth, selectAuthLoading } from "../../features/auth/store/auth.slice";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

// ── Full-screen loading spinner shown only during initial auth check ──────────
function FullScreenLoader() {
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-background gap-3">
      {/* Animated Raven "R" mark */}
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-sidebar-primary/10 flex items-center justify-center">
          <span className="text-2xl font-black text-sidebar-primary select-none">R</span>
        </div>
        {/* Spinning ring */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-sidebar-primary animate-spin" />
      </div>
      <p className="text-xs text-muted-foreground animate-pulse">Loading Raven…</p>
    </div>
  );
}

export default function AppLayout() {
  const isAuth    = useSelector(selectIsAuth);
  const isLoading = useSelector(selectAuthLoading);

  if (isLoading) {
    return <FullScreenLoader />;
  }

  // fetchMe() is done and user is not authenticated → redirect
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}