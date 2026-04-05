// ─── src/components/layout/AuthLayout.jsx ────────────────────────────────────
import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
     selectIsAuth,
     selectAuthLoading,
} from "../../features/auth/store/auth.slice";
import { Spinner } from "../ui/Spinner";

export default function AuthLayout() {
     const isAuth = useSelector(selectIsAuth);
     const isLoading = useSelector(selectAuthLoading);

     if (isLoading)
          return (
               <div className="h-screen flex items-center justify-center bg-[#0a0a0a]">
                    <Spinner size="lg" />
               </div>
          );
     if (isAuth) return <Navigate to="/" replace />;

     return (
          <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
               {/* ── Background image (auth-background.webp) ── */}
               <div
                    className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                    style={{ backgroundImage: "url('/auth-background.webp')" }}
               />
               {/* Dark overlay so form stays readable */}
               <div className="absolute inset-0 bg-black/60" />

               {/* ── Form card ── */}
               <div className="relative z-10 w-full max-w-md px-4">
                    {/* Logo: Raven-R-Logo.jpeg */}
                    <div className="flex flex-col items-center mb-8">
                         <img
                              src="/Raven-R-Logo.jpeg"
                              alt="Raven"
                              className="w-16 h-16 rounded-2xl object-cover shadow-2xl mb-4"
                              onError={(e) => {
                                   // Fallback letter if image missing
                                   e.currentTarget.style.display = "none";
                                   document.getElementById("raven-logo-fallback").style.display =
                                        "flex";
                              }}
                         />
                         {/* Hidden fallback */}
                         <div
                              id="raven-logo-fallback"
                              className="hidden w-16 h-16 rounded-2xl bg-[#1a1a1a] items-center justify-center mb-4 shadow-2xl border border-white/10"
                         >
                              <span className="text-3xl font-black text-white">R</span>
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
