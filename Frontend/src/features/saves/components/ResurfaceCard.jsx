// ─── src/features/saves/components/ResurfaceCard.jsx ─────────────────────────
import { RiClockwiseLine } from "react-icons/ri";
import { cn, timeAgo, truncate } from "../../../lib/utils";

export default function ResurfaceCard({ save, onClick }) {
  return (
    <div
      onClick={() => onClick?.(save)}
      className={cn(
        "shrink-0 w-52 rounded-xl border border-border bg-card p-3 cursor-pointer hover:border-violet-500/30 hover:shadow-md transition-all space-y-1.5",
      )}
    >
      <div className="flex items-center gap-1.5 text-[10px] text-violet-400">
        <RiClockwiseLine size={11} /> Resurfaced
      </div>
      {save.thumbnail && (
        <img
          src={save.thumbnail}
          alt=""
          className="w-full h-20 object-cover rounded-lg"
        />
      )}
      <p className="text-xs font-medium text-foreground line-clamp-2">
        {save.title}
      </p>
      <p className="text-[10px] text-muted-foreground">
        {timeAgo(save.createdAt)}
      </p>
    </div>
  );
}
