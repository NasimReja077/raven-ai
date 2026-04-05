// import { cn } from "@/lib/utils"

// function Skeleton({
//   className,
//   ...props
// }) {
//   return (<div className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />);
// }

// export { Skeleton }



// ─── src/components/ui/Skeleton.jsx ──────────────────────────────────────────
import { Skeleton as ShadSkeleton } from "@/components/ui/skeleton";
import { cn } from "../../lib/utils";

export function SaveCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <ShadSkeleton className="h-36 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <div className="flex gap-2"><ShadSkeleton className="h-4 w-14 rounded-md" /><ShadSkeleton className="h-4 w-24" /></div>
        <ShadSkeleton className="h-4 w-full" />
        <ShadSkeleton className="h-4 w-3/4" />
        <div className="flex gap-1 pt-1"><ShadSkeleton className="h-4 w-10 rounded-full" /><ShadSkeleton className="h-4 w-12 rounded-full" /></div>
      </div>
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-1.5 px-2">
      {[...Array(5)].map((_, i) => <ShadSkeleton key={i} className="h-8 w-full rounded-lg" />)}
    </div>
  );
}