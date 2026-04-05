// ─── src/features/auth/pages/VerifyOTPPage.jsx ───────────────────────────────
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useVerifyOTP, useResendOTP } from "../hooks/useAuth";

const schema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d+$/, "Numbers only"),
});

export default function VerifyOTPPage() {
  const [params] = useSearchParams();
  const email = params.get("email") || "";
  const { mutate, isPending, error } = useVerifyOTP();
  const { mutate: resend, isPending: resending } = useResendOTP();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl text-center">
      <div className="text-4xl mb-3">📬</div>
      <h2 className="text-xl font-bold text-white mb-1">Check your email</h2>
      <p className="text-sm text-white/40 mb-6">
        We sent a 6-digit OTP to{" "}
        <span className="text-violet-400">{email}</span>
      </p>
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          {error.response?.data?.message}
        </div>
      )}
      <form
        onSubmit={handleSubmit((d) => mutate({ email, otp: d.otp }))}
        className="space-y-4"
      >
        <Input
          {...register("otp")}
          placeholder="000000"
          maxLength={6}
          className="text-center text-2xl tracking-[0.5em] bg-white/5 border-white/10 text-white h-12 focus:border-violet-500"
        />
        {errors.otp && (
          <p className="text-xs text-red-400">{errors.otp.message}</p>
        )}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Verifying…" : "Verify email"}
        </Button>
      </form>
      <button
        onClick={() => resend({ email })}
        disabled={resending}
        className="mt-4 text-sm text-white/40 hover:text-white/70 transition-colors"
      >
        {resending ? "Sending…" : "Resend OTP"}
      </button>
    </div>
  );
}
