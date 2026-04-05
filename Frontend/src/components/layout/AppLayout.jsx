
// ─── src/components/layout/AppLayout.jsx ─────────────────────────────────────
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuth, selectAuthLoading } from "../../features/auth/store/auth.slice";
import Sidebar from "./Sidebar";
import Topbar  from "./Topbar";
import { Spinner } from "../ui";

export default function AppLayout() {
  const isAuth    = useSelector(selectIsAuth);
  const isLoading = useSelector(selectAuthLoading);

  if (isLoading) return (
    <div className="h-screen flex items-center justify-center bg-background">
      <Spinner size="lg" />
    </div>
  );
  if (!isAuth) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}