// src/components/common/SplashScreen.jsx
import { useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export default function SplashScreen() {
  const [phase, setPhase] = useState(0); // 0=logo in, 1=text in, 2=tagline in

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 300);
    const t2 = setTimeout(() => setPhase(2), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0a0a0a] flex flex-col items-center justify-center select-none">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, rgba(124,58,237,0.12) 0%, transparent 70%)" }} />

      {/* Logo */}
      <div className={cn(
        "transition-all duration-500",
        phase >= 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        <img
          src="/Raven AI Logo.png"
          alt="Raven"
          className="w-20 h-20 rounded-2xl object-cover shadow-2xl mb-6"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            document.getElementById("splash-fallback").style.display = "flex";
          }}
        />
        {/* Fallback */}
        <div
          id="splash-fallback"
          className="hidden w-20 h-20 rounded-2xl bg-white/5 border border-white/10 items-center justify-center mb-6 shadow-2xl"
        >
          <span className="text-4xl font-black text-white">R</span>
        </div>
      </div>

      {/* App name */}
      <div className={cn(
        "transition-all duration-500 delay-100",
        phase >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
      )}>
        <h1 className="text-3xl font-black text-white tracking-tight text-center">
          Raven
        </h1>
      </div>

      {/* Tagline */}
      <div className={cn(
        "transition-all duration-500 delay-200",
        phase >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}>
        <p className="text-sm text-white/35 text-center mt-2 tracking-wide">
          Raven remembers everything.
        </p>
      </div>

      {/* Bottom loader dots */}
      <div className="absolute bottom-12 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/20"
            style={{
              animation: "splash-pulse 1.2s ease-in-out infinite",
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splash-pulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(1); }
          40% { opacity: 0.8; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}