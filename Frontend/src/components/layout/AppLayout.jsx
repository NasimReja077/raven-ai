// src/components/layout/AppLayout.jsx
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAuth, selectAuthLoading } from "../../features/auth/store/auth.slice";
import AppSidebar from "./AppSidebar";
import Topbar from "./Topbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Spinner } from "../ui/Spinner";

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
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}