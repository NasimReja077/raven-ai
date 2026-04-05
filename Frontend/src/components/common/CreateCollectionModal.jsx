// ─── src/components/common/CreateCollectionModal.jsx ─────────────────────────
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCreateCollection } from "../../features/collections/hooks/useCollections";
import { ICON_OPTIONS, getIcon } from "./IconMap";
import { cn } from "../../lib/utils";

const schema = z.object({ name: z.string().min(1).max(50), description: z.string().max(100).optional() });

export default function CreateCollectionModal({ isOpen, onClose }) {
  const [icon, setIcon] = useState("GoFileDirectoryFill");
  const { mutate, isPending } = useCreateCollection();
  const { register, handleSubmit, reset, formState: { errors } } = useForm({ resolver: zodResolver(schema) });

  const close = () => { reset(); setIcon("GoFileDirectoryFill"); onClose(); };
  const onSubmit = (d) => mutate({ ...d, icon }, { onSuccess: close });

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>New collection</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Icon picker */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Icon</Label>
            <div className="flex flex-wrap gap-1.5">
              {ICON_OPTIONS.map((k) => (
                <button type="button" key={k} onClick={() => setIcon(k)}
                  className={cn("w-8 h-8 rounded-lg text-base flex items-center justify-center border transition-all",
                    icon === k ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-border/80 hover:bg-accent")}>
                  {getIcon(k)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="cname">Name <span className="text-destructive">*</span></Label>
            <Input id="cname" placeholder="e.g. Dev Resources" {...register("name")} autoFocus />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1">
            <Label htmlFor="cdesc">Description <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="cdesc" placeholder="What's this collection about?" {...register("description")} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={close}>Cancel</Button>
            <Button type="submit" size="sm" disabled={isPending}>{isPending ? "Creating…" : "Create"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
