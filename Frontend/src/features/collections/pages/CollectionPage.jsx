// ─── src/features/collections/pages/CollectionPage.jsx ───────────────────────
import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCollectionById, useCollectionSaves, useDeleteCollection, useUpdateCollection } from "../hooks/useCollections";
import SaveCard from "../../../components/common/SaveCard";
import { SaveCardSkeleton } from "../../../components/ui/SaveCardSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Spinner } from "../../../components/ui/Spinner";
import SaveDetailPanel from "../../saves/components/SaveDetailPanel";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { Button } from "@/components/ui/button";
import { getIcon } from "../../../components/common/IconMap";
import { RiDeleteBinLine, RiSaveLine } from "react-icons/ri";

export default function CollectionPage() {
  const { id } = useParams();
  const { data: collection, isLoading: cLoad } = useCollectionById(id);
  const { data, isLoading: sLoad } = useCollectionSaves(id);
  const { mutate: del } = useDeleteCollection();
  const [sel, setSel] = useState(null);
  const [confirmDel, setConfirmDel] = useState(false);

  const saves = data?.saves || [];

  if (cLoad) return <div className="flex items-center justify-center h-64"><Spinner /></div>;
  if (!collection) return <EmptyState title="Collection not found" />;

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">
              {getIcon(collection.icon)}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">{collection.name}</h1>
              {collection.description && (
                <p className="text-xs text-muted-foreground">{collection.description}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">{saves.length} saves</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive gap-1.5"
            onClick={() => setConfirmDel(true)}>
            <RiDeleteBinLine size={14} /> Delete
          </Button>
        </div>

        {sLoad ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <SaveCardSkeleton key={i} />)}
          </div>
        ) : saves.length === 0 ? (
          <EmptyState icon={RiSaveLine} title="No saves in this collection"
            description="Add saves from the main feed using the ⋯ menu." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {saves.map((s) => <SaveCard key={s._id} save={s} onClick={setSel} />)}
          </div>
        )}
      </div>

      {sel && <SaveDetailPanel save={sel} onClose={() => setSel(null)} />}

      <ConfirmDialog isOpen={confirmDel} title="Delete collection?"
        message="This will delete the collection but NOT the saves inside it."
        onConfirm={() => { del(id); setConfirmDel(false); history.back(); }}
        onCancel={() => setConfirmDel(false)} />
    </div>
  );
}
