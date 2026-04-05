// src/components/layout/AuthLayout.jsx

import { Outlet, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  selectIsAuth,
  selectAuthLoading,
} from "../../features/auth/store/auth.slice";
import { motion } from "framer-motion";

// Reuse the same spinner style as AppLayout
function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080808]">
      <div className="relative">
        <div className="w-12 h-12 rounded-2xl bg-violet-600/20 flex items-center justify-center">
          <span className="text-2xl font-black text-violet-400 select-none">
            R
          </span>
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent border-t-violet-500 animate-spin" />
      </div>
    </div>
  );
}

export default function AuthLayout() {
  const isAuth = useSelector(selectIsAuth);
  const isLoading = useSelector(selectAuthLoading);

  // ✅ FIX: Wait for auth check before deciding
  if (isLoading) return <FullScreenLoader />;

  // Already authenticated → go to app
  if (isAuth) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Purple-wave background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/auth-background.webp')" }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/65" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-[400px] px-4">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center mb-8"
        >
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-2xl mb-4 ring-1 ring-white/10">
            <img
              src="/Raven-R-Logo.jpeg"
              alt="Raven"
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                document
                  .getElementById("raven-logo-fallback-auth")
                  ?.classList.remove("hidden");
                document
                  .getElementById("raven-logo-fallback-auth")
                  ?.classList.add("flex");
              }}
            />
          </div>
          {/* Fallback letter mark */}
          <div
            id="raven-logo-fallback-auth"
            className="hidden w-14 h-14 rounded-2xl bg-white/10 items-center justify-center mb-4 shadow-2xl border border-white/10"
          >
            <span className="text-3xl font-black text-white">R</span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            Raven
          </h1>
          <p className="text-sm text-white/40 mt-1 text-center">
            Raven remembers everything.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}
