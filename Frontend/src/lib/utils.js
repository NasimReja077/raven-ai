import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format } from "date-fns";

/** shadcn cn() helper */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/** "2 hours ago" */
export const timeAgo = (date) =>
  date ? formatDistanceToNow(
    new Date(date),
    {
      addSuffix: true
    }
  ) : "";


/** "Apr 5, 2026" */
export const fmtDate = (date) =>
  date ? format(
    new Date(date),
    "MMM d, yyyy"
  ) : "";


/** Truncate string */
export const truncate = (str, n = 80) =>
  str?.length > n ? str.slice(0, n) + "…" : str || "";

/** Extract hostname for display */
export const hostname = (url) => {
  try {
    return new URL(url)
      .hostname
      .replace("www.", "");
  }
  catch {
    return url || "";
  }
};

/** Map save type - readable label */
export const TYPE_LABELS = {
  link: "Link",
  article: "Article",
  tweet: "Tweet",
  youtube: "YouTube",
  github: "GitHub",
  image: "Image",
  pdf: "PDF",
  note: "Note",
  file: "File",
};

/** Processing status color */
export const statusColor = (status) => ({
  pending: "text-yellow-400",
  processing: "text-blue-400",
  completed: "text-green-400",
  failed: "text-red-400",
}[status] || "text-muted-foreground");