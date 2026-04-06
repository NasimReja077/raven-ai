// ─── src/features/saves/pages/FavoritesPage.jsx ──────────────────────────────
import { useSaves } from "../hooks/useSaves";
import SaveCard from "../../../components/common/SaveCard";
import { SaveCardSkeleton } from "../../../components/ui/SaveCardSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { RiHeartLine } from "react-icons/ri";
import { useState } from "react";
import SaveDetailPanel from "../components/SaveDetailPanel";

export default function FavoritesPage() {
  const { data, isLoading } = useSaves({ isFavorite: "true", limit: 50 });
  const [sel, setSel] = useState(null);
  const saves = data?.saves || [];

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        <h1 className="text-lg font-bold text-foreground">Favorites</h1>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(6)].map((_, i) => (
              <SaveCardSkeleton key={i} />
            ))}
          </div>
        ) : saves.length === 0 ? (
          <EmptyState
            icon={RiHeartLine}
            title="No favorites yet"
            description="Heart any save to find it here."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {saves.map((s) => (
              <SaveCard key={s._id} save={s} onClick={setSel} />
            ))}
          </div>
        )}
      </div>
      {sel && <SaveDetailPanel save={sel} onClose={() => setSel(null)} />}
    </div>
  );
}
