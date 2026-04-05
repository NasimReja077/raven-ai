
// ─── src/features/auth/pages/ResetPasswordPage.jsx ───────────────────────────
import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { useResetPassword } from "../hooks/useAuth";

const schema = z.object({
  password: z.string().min(8).regex(/[0-9]/, "Must contain number").regex(/[A-Z]/, "Must contain uppercase"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export default function ResetPasswordPage() {
  const { token } = useParams();
  const { mutate, isPending, error } = useResetPassword();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-1 text-center">Set new password</h2>
      <p className="text-sm text-white/40 text-center mb-6">Make it strong — you only do this once.</p>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error.response?.data?.message}</div>}
      <form onSubmit={handleSubmit((d) => mutate({ token, ...d }))} className="space-y-3">
        {[
          { name: "password",        label: "New password" },
          { name: "confirmPassword", label: "Confirm password" },
        ].map(({ name, label }) => (
          <div key={name} className="space-y-1.5">
            <Label className="text-white/60 text-xs">{label}</Label>
            <Input {...register(name)} type="password" placeholder="••••••••"
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500" />
            {errors[name] && <p className="text-xs text-red-400">{errors[name].message}</p>}
          </div>
        ))}
        <Button type="submit" className="w-full mt-1" disabled={isPending}>
          {isPending ? "Resetting…" : "Reset password"}
        </Button>
      </form>
    </div>
  );
}