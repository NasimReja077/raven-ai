
// ─── src/features/user/pages/SettingsPage.jsx ────────────────────────────────
import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useProfile, useUpdateProfile, useUpdatePassword, useUploadAvatar } from "../hooks/useUser";
import { useSelector } from "react-redux";
import { selectUser } from "../../auth/store/auth.slice";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input }  from "@/components/ui/input";
import { Label }  from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Spinner } from "../../../components/ui/Spinner";
import { RiCameraLine } from "react-icons/ri";

const profileSchema = z.object({ username: z.string().min(3).max(50) });
const pwSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: "Passwords don't match", path: ["confirmPassword"] });

export default function SettingsPage() {
  const user = useSelector(selectUser);
  const fileRef = useRef(null);
  const { mutate: uploadAvatar, isPending: uploading } = useUploadAvatar();
  const { mutate: updateProfile, isPending: saving } = useUpdateProfile();
  const { mutate: updatePassword, isPending: changingPw } = useUpdatePassword();

  const pf = useForm({ resolver: zodResolver(profileSchema), defaultValues: { username: user?.username || "" } });
  const pw = useForm({ resolver: zodResolver(pwSchema) });

  return (
    <div className="max-w-lg space-y-8">
      <h1 className="text-lg font-bold text-foreground">Settings</h1>

      {/* Avatar */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Profile photo</h2>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-lg">{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <button onClick={() => fileRef.current?.click()}
              className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-opacity">
              {uploading ? <Spinner size="sm" /> : <RiCameraLine size={12} />}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" hidden
            onChange={(e) => e.target.files?.[0] && uploadAvatar(e.target.files[0])} />
          <div>
            <p className="text-sm font-medium text-foreground">{user?.username}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </section>

      <Separator />

      {/* Username */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Update username</h2>
        <form onSubmit={pf.handleSubmit((d) => updateProfile(d))} className="space-y-3">
          <div className="space-y-1">
            <Label>Username</Label>
            <Input {...pf.register("username")} />
            {pf.formState.errors.username && (
              <p className="text-xs text-destructive">{pf.formState.errors.username.message}</p>
            )}
          </div>
          <Button type="submit" size="sm" disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
        </form>
      </section>

      <Separator />

      {/* Password */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Change password</h2>
        <form onSubmit={pw.handleSubmit((d) => updatePassword(d))} className="space-y-3">
          {[
            { name: "currentPassword", label: "Current password" },
            { name: "newPassword",     label: "New password" },
            { name: "confirmPassword", label: "Confirm new password" },
          ].map(({ name, label }) => (
            <div key={name} className="space-y-1">
              <Label>{label}</Label>
              <Input {...pw.register(name)} type="password" />
              {pw.formState.errors[name] && (
                <p className="text-xs text-destructive">{pw.formState.errors[name].message}</p>
              )}
            </div>
          ))}
          <Button type="submit" size="sm" disabled={changingPw}>{changingPw ? "Updating…" : "Update password"}</Button>
        </form>
      </section>
    </div>
  );
}
