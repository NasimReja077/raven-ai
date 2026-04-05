
// ─── src/features/auth/pages/ForgotPasswordPage.jsx ──────────────────────────
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { useForgotPassword } from "../hooks/useAuth";

const schema = z.object({ email: z.string().email() });

export default function ForgotPasswordPage() {
  const { mutate, isPending, error, isSuccess } = useForgotPassword();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  if (isSuccess) return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl text-center">
      <div className="text-4xl mb-3">📨</div>
      <h2 className="text-xl font-bold text-white mb-2">Check your inbox</h2>
      <p className="text-sm text-white/50 mb-4">If that email is registered, a reset link is on its way.</p>
      <Link to="/login" className="text-sm text-violet-400 hover:text-violet-300">Back to login</Link>
    </div>
  );

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-1 text-center">Forgot password?</h2>
      <p className="text-sm text-white/40 text-center mb-6">
        Enter your email and we'll send a reset link.
      </p>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error.response?.data?.message}</div>}
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-white/60 text-xs">Email</Label>
          <Input {...register("email")} type="email" placeholder="you@example.com"
            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500" />
          {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
        </div>
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="text-center mt-4">
        <Link to="/login" className="text-sm text-white/40 hover:text-white/70">Back to login</Link>
      </p>
    </div>
  );
}
