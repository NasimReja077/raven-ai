
// ─── src/components/common/SaveCard.jsx 
import { useState } from "react";
import { RiHeartLine, RiHeartFill } from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { useUpdateSave, useDeleteSave } from "../../features/saves/hooks/useSaves";
import { useCollections } from "../../features/collections/hooks/useCollections";
import ConfirmDialog from "./ConfirmDialog";
import KebabMenu from "./KebabMenu";
import { cn, timeAgo, truncate, hostname, TYPE_LABELS } from "../../lib/utils";

const TYPE_COLORS = {
  youtube: "bg-red-500/15 text-red-400 border-red-500/20",
  tweet:   "bg-sky-500/15 text-sky-400 border-sky-500/20",
  github:  "bg-neutral-500/15 text-neutral-400 border-neutral-500/20",
  pdf:     "bg-orange-500/15 text-orange-400 border-orange-500/20",
  image:   "bg-pink-500/15 text-pink-400 border-pink-500/20",
  article: "bg-violet-500/15 text-violet-400 border-violet-500/20",
  link:    "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

export default function SaveCard({ save, onClick }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: updateSave } = useUpdateSave();
  const { mutate: deleteSave } = useDeleteSave();
  const { data: collections = [] } = useCollections();

  const toggle = (field, val) => updateSave({ id: save._id, [field]: val });

  return (
    <>
      <div onClick={() => onClick?.(save)}
        className={cn(
          "group relative flex flex-col bg-card border border-border rounded-xl overflow-hidden",
          "hover:border-border/80 hover:shadow-md transition-all cursor-pointer",
          save.processingStatus === "failed" && "opacity-60"
        )}>

        {save.thumbnail && (
          <div className="h-36 overflow-hidden bg-muted shrink-0">
            <img src={save.thumbnail} alt="" loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          </div>
        )}

        <div className="p-3 flex flex-col gap-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md border", TYPE_COLORS[save.type] || TYPE_COLORS.link)}>
              {TYPE_LABELS[save.type] || save.type}
            </span>
            {save.favicon && <img src={save.favicon} alt="" className="w-3.5 h-3.5 rounded-sm" />}
            <span className="text-[10px] text-muted-foreground truncate">{hostname(save.url)}</span>
          </div>

          <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
            {save.title || save.url}
          </h3>

          {(save.shortNote || save.description) && (
            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
              {truncate(save.shortNote || save.description, 100)}
            </p>
          )}

          {save.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-auto pt-1">
              {save.tags.slice(0, 4).map((t) => (
                <span key={t._id} className="text-[9px] px-1.5 py-0.5 rounded-full border font-medium"
                  style={{ color: t.color, borderColor: `${t.color}40`, background: `${t.color}15` }}>
                  {t.name}
                </span>
              ))}
              {save.tags.length > 4 && (
                <span className="text-[9px] text-muted-foreground">+{save.tags.length - 4}</span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-1 pt-2 border-t border-border/50">
            <span className="text-[10px] text-muted-foreground">{timeAgo(save.createdAt)}</span>
            <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => toggle("isFavorite", !save.isFavorite)}
                className="p-1.5 rounded hover:bg-accent transition-colors">
                {save.isFavorite
                  ? <RiHeartFill size={13} className="text-red-400" />
                  : <RiHeartLine size={13} className="text-muted-foreground hover:text-foreground" />}
              </button>
              <KebabMenu save={save} collections={collections}
                onDelete={() => setConfirmDelete(true)}
                onArchive={() => toggle("isArchived", !save.isArchived)} />
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete save?"
        message="This will permanently remove this save. This cannot be undone."
        onConfirm={() => { deleteSave(save._id); setConfirmDelete(false); }}
        onCancel={() => setConfirmDelete(false)} />
    </>
  );
}