// ─── src/components/ui/Spinner.jsx ───────────────────────────────────────────
import { cn } from "../../lib/utils";

export function Spinner({ size = "md", className }) {
  const sz = { sm: "w-4 h-4", md: "w-6 h-6", lg: "w-10 h-10" }[size];
  return (
    <div className={cn("animate-spin rounded-full border-2 border-border border-t-primary", sz, className)} />
  );
}

