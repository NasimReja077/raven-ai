
// ─── src/components/common/KebabMenu.jsx ─────────────────────────────────────
// ✅ FIXED: added missing RiMoreLine import
import {
  RiArchiveLine, RiDeleteBinLine, RiFolderAddLine,
  RiCheckLine, RiMoreLine, 
} from "react-icons/ri";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger,
  DropdownMenuSubContent, DropdownMenuTrigger, DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { savesApi } from "../../features/saves/api/saves.api";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export default function KebabMenu({ save, collections = [], onDelete, onArchive }) {
  const qc = useQueryClient();

  const handleAddToCollection = async (colId) => {
    try {
      await savesApi.addToCollection(save._id, { collectionId: colId });
      qc.invalidateQueries({ queryKey: ["saves"] });
      toast.success("Added to collection");
    } catch {
      toast.error("Failed to add to collection");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="p-1.5 rounded hover:bg-accent transition-colors">
          <RiMoreLine size={13} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 text-sm">
        {collections.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <RiFolderAddLine size={13} /> Add to collection
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {collections.map((col) => (
                  <DropdownMenuItem key={col._id} className="gap-2"
                    onClick={() => handleAddToCollection(col._id)}>
                    <RiCheckLine size={12}
                      className={save.collections?.some((c) => (c._id || c) === col._id)
                        ? "opacity-100" : "opacity-0"} />
                    {col.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2" onClick={onArchive}>
          <RiArchiveLine size={13} /> {save.isArchived ? "Unarchive" : "Archive"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onClick={onDelete}>
          <RiDeleteBinLine size={13} /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}