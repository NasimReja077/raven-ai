// ─── src/components/layout/AuthLayout.jsx ────────────────────────────────────
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
     selectIsAuth,
     selectAuthLoading,
} from "../../features/auth/store/auth.slice";
import { Spinner } from "../ui";

export default function AuthLayout() {
     const isAuth = useSelector(selectIsAuth);
     const isLoading = useSelector(selectAuthLoading);

     if (isLoading)
          return (
               <div className="h-screen flex items-center justify-center bg-background">
                    <Spinner />
               </div>
          );
     if (isAuth) return <Navigate to="/" replace />;

     return (
          <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
               {/* Purple wave background */}
               <div className="absolute inset-0 bg-linear-to-br from-[#0d0d0d] via-[#1a0a2e] to-[#0d0d0d]" />
               <div className="absolute top-0 left-1/4 w-150 h-150 bg-purple-900/20 rounded-full blur-[120px] pointer-events-none" />
               <div className="absolute bottom-0 right-1/4 w-100 h-100 bg-violet-900/15 rounded-full blur-[100px] pointer-events-none" />

               <div className="relative z-10 w-full max-w-md px-4">
                    {/* Logo */}
                    <div className="flex flex-col items-center mb-8">
                         <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] flex items-center justify-center mb-4 shadow-lg">
                              <span className="text-2xl font-black text-white">R</span>
                         </div>
                         <h1 className="text-2xl font-bold text-white tracking-tight">
                              Raven
                         </h1>
                         <p className="text-sm text-white/40 mt-1">
                              Raven remembers everything.
                         </p>
                    </div>
                    <Outlet />
               </div>
          </div>
     );
}
