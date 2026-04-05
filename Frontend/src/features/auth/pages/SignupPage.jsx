
// ─── src/features/auth/pages/SignupPage.jsx ───────────────────────────────────
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { useSignup } from "../hooks/useAuth";

const schema = z.object({
  username: z.string().min(3).max(50),
  email:    z.string().email(),
  password: z.string().min(6).regex(/[0-9]/, "Must contain number").regex(/[A-Z]/, "Must contain uppercase").regex(/[!@#$%^&*]/, "Must contain special char"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export default function SignupPage() {
  const { mutate, isPending, error } = useSignup();
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  return (
    <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 shadow-2xl">
      <h2 className="text-xl font-bold text-white mb-1 text-center">Create account</h2>
      <p className="text-sm text-white/40 text-center mb-6">
        Already have one? <Link to="/login" className="text-violet-400 hover:text-violet-300">Sign in</Link>
      </p>
      {error && <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error.response?.data?.message || "Signup failed"}</div>}
      <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-3">
        {[
          { name: "username", label: "Username", type: "text", placeholder: "johndoe" },
          { name: "email",    label: "Email",    type: "email", placeholder: "john@example.com" },
          { name: "password", label: "Password", type: "password", placeholder: "••••••••" },
          { name: "confirmPassword", label: "Confirm password", type: "password", placeholder: "••••••••" },
        ].map(({ name, label, type, placeholder }) => (
          <div key={name} className="space-y-1">
            <Label className="text-white/60 text-xs">{label}</Label>
            <Input {...register(name)} type={type} placeholder={placeholder}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500" />
            {errors[name] && <p className="text-xs text-red-400">{errors[name].message}</p>}
          </div>
        ))}
        <Button type="submit" className="w-full mt-1" disabled={isPending}>
          {isPending ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="text-[10px] text-white/25 text-center mt-4">By signing up, you agree to our Terms & Privacy Policy.</p>
    </div>
  );
}
