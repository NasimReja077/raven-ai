// ─── src/features/auth/pages/LoginPage.jsx ───────────────────────────────────
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin } from "../hooks/useAuth";
import { cn } from "../../../lib/utils";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export default function LoginPage() {
  const { mutate, isPending, error } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-1 text-center">
        Welcome back
      </h2>
      <p className="text-sm text-white/40 text-center mb-6">
        Don't have an account?{" "}
        <Link to="/signup" className="text-violet-400 hover:text-violet-300">
          Sign up
        </Link>
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error.response?.data?.message || "Login failed"}
        </div>
      )}

      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs">Email</Label>
          <Input
            {...register("email")}
            type="email"
            placeholder="alan@example.com"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
          />
          {errors.email && (
            <p className="text-xs text-red-400">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <Label className="text-white/60 text-xs">Password</Label>
            <Link
              to="/forgot-password"
              className="text-[11px] text-violet-400 hover:text-violet-300"
            >
              Forgot?
            </Link>
          </div>
          <Input
            {...register("password")}
            type="password"
            placeholder="••••••••"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
          />
          {errors.password && (
            <p className="text-xs text-red-400">{errors.password.message}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}
