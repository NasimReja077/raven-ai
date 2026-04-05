// ─── src/features/saves/components/SaveModal.jsx ─────────────────────────────
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useCreateSave } from "../hooks/useSaves";

const schema = z.object({
  url: z.string().url("Please enter a valid URL"),
  userNote: z.string().max(1000).optional(),
});

export default function SaveModal({ isOpen, onClose }) {
  const { mutate, isPending, error } = useCreateSave();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const close = () => {
    reset();
    onClose();
  };
  const onSubmit = (d) => mutate(d, { onSuccess: close });

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Save a URL</DialogTitle>
        </DialogHeader>
        {error && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm text-destructive">
            {error.response?.data?.message || "Failed to save"}
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="space-y-1">
            <Label>
              URL <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("url")}
              placeholder="https://example.com"
              autoFocus
              type="url"
            />
            {errors.url && (
              <p className="text-xs text-destructive">{errors.url.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <Label>
              Note{" "}
              <span className="text-muted-foreground text-xs">(optional)</span>
            </Label>
            <Textarea
              {...register("userNote")}
              placeholder="Why are you saving this?"
              rows={2}
              maxLength={1000}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" size="sm" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
