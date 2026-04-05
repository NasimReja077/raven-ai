// ─── src/components/common/CreateTagModal.jsx ────────────────────────────────
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCreateTag } from "../../features/tags/hooks/useTags";
import { cn } from "../../lib/utils";

const COLORS = ["#7c6af7","#378ADD","#1D9E75","#D85A30","#D4537E","#f87171","#fbbf24","#4ade80","#a78bfa","#38bdf8"];
const schema = z.object({ name: z.string().min(1).max(50) });

export default function CreateTagModal({ isOpen, onClose }) {
  const [color, setColor] = useState(COLORS[0]);
  const { mutate, isPending } = useCreateTag();
  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });
  const name = watch("name", "");

  const close = () => { reset(); setColor(COLORS[0]); onClose(); };
  const onSubmit = (d) => mutate({ ...d, color }, { onSuccess: close });

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader><DialogTitle>New tag</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label>Name <span className="text-destructive">*</span></Label>
            <Input placeholder="e.g. javascript" {...register("name")} autoFocus />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button type="button" key={c} onClick={() => setColor(c)}
                  className={cn("w-6 h-6 rounded-full transition-all", color === c ? "ring-2 ring-offset-2 ring-offset-background scale-110" : "hover:scale-105")}
                  style={{ background: c, ringColor: c }} />
              ))}
            </div>
          </div>
          {/* Preview */}
          {name && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Preview:</span>
              <span className="text-xs px-2 py-0.5 rounded-full border font-medium"
                style={{ color, borderColor: `${color}50`, background: `${color}15` }}>
                {name}
              </span>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={close}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Creating…" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
