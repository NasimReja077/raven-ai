
// ─── src/features/tags/pages/TagPage.jsx ─────────────────────────────────────
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTagById, useTagSaves, useDeleteTag } from "../hooks/useTags";
import SaveCard from "../../../components/common/SaveCard";
import { SaveCardSkeleton } from "../../../components/ui/SaveCardSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Spinner } from "../../../components/ui/Spinner";
import SaveDetailPanel from "../../saves/components/SaveDetailPanel";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { RiDeleteBinLine, RiSaveLine } from "react-icons/ri";

export default function TagPage() {
  const { id } = useParams();
  const { data: tag, isLoading: tLoad } = useTagById(id);
  const { data, isLoading: sLoad } = useTagSaves(id);
  const { mutate: del } = useDeleteTag();
  const [sel, setSel] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);

  const saves = data?.saves || [];

  if (tLoad) return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  if (!tag) return <EmptyState title="Tag not found" />;

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full" style={{ background: tag.color }} />
            <div>
              <h1 className="text-lg font-bold text-foreground">{tag.name}</h1>
              <p className="text-xs text-muted-foreground">{saves.length} saves</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-1.5"
            onClick={() => setConfirmDel(true)}>
            <RiDeleteBinLine size={14} /> Delete tag
          </Button>
        </div>

        {sLoad ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <SaveCardSkeleton key={i} />)}
          </div>
        ) : saves.length === 0 ? (
          <EmptyState icon={RiSaveLine} title="No saves with this tag" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {saves.map((s) => <SaveCard key={s._id} save={s} onClick={setSel} />)}
          </div>
        )}
      </div>
      {sel && <SaveDetailPanel save={sel} onClose={() => setSel(null)} />}

      <ConfirmDialog isOpen={confirmDel} title="Delete tag?"
        message="This will remove the tag from all saves."
        onConfirm={() => { del(id); setConfirmDel(false); history.back(); }}
        onCancel={() => setConfirmDel(false)} />
    </div>
  );
}
