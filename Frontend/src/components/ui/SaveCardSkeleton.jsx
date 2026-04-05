
// ─── src/components/ui/SaveCardSkeleton.jsx ──────────────────────────────────
import { Skeleton } from "@/components/ui/skeleton";   // ✅ imports the primitive above
import { cn } from "../../lib/utils";

export function SaveCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-4 w-10 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-1.5 px-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-8 w-full rounded-lg" />
      ))}
    </div>
  );
}
