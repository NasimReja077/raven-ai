// ─── src/components/ui/EmptyState.jsx ────────────────────────────────────────
import { RiInboxLine } from "react-icons/ri";
import { cn } from "../../lib/utils";

export function EmptyState({ icon: Icon = RiInboxLine, title = "Nothing here yet", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon size={28} className="text-muted-foreground" />
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}