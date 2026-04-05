// src/components/ui/skeleton.jsx

import { cn } from "@/lib/utils";

// ── Primitive Skeleton 
export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      {...props}
    />
  );
}

// ── SaveCard grid skeleton ────────────────────────────────────────────────────
export function SaveCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <Skeleton className="h-36 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <div className="flex gap-2 items-center">
          <Skeleton className="h-4 w-14 rounded-md" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex gap-1 pt-1">
          <Skeleton className="h-4 w-10 rounded-full" />
          <Skeleton className="h-4 w-12 rounded-full" />
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-border/50">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
      </div>
    </div>
  );
}

// ── Sidebar skeleton 
export function SidebarSkeleton() {
  return (
    <div className="space-y-1.5 px-2">
      {[...Array(5)].map((_, i) => (
        <Skeleton key={i} className="h-8 w-full rounded-lg" />
      ))}
    </div>
  );
}

// ── List view skeleton 
export function SaveListSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 bg-card border border-border rounded-xl">
      <Skeleton className="w-14 h-14 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-1/4" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

// ── Grid of skeletons 
export function SkeletonGrid({ count = 8 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SaveCardSkeleton key={i} />
      ))}
    </div>
  );
}