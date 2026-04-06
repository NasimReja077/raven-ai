// src/features/saves/pages/AllSavesPage.jsx
//
// FIX: Semantic search was not sending the "semantic" query param correctly.
// The params object was building `semantic: "true"` only when search was present,
// but the useSaves hook received it and the backend needed it as a query param.
// Also: clicking a SaveCard now navigates to /saves/:id instead of opening a panel.

import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useSaves, useSaveStats, useResurface } from "../hooks/useSaves";
import { useDebounce } from "../../../hooks/useDebounce";
import SaveCard from "../../../components/common/SaveCard";
import FilterTabs from "../../../components/common/FilterTabs";
import { SaveCardSkeleton } from "../../../components/ui/skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import SaveDetailPanel from "../components/SaveDetailPanel";
import ResurfaceCard from "../components/ResurfaceCard";
import { RiSaveLine } from "react-icons/ri";
import { cn } from "../../../lib/utils";

export default function AllSavesPage() {
  const { search, semantic, activeType } = useSelector((s) => s.ui);
  const debouncedSearch = useDebounce(search, 400);
  const [selectedSave, setSelectedSave] = useState(null);
  const nav = useNavigate();

  // FIX: Always include semantic param when search is present.
  // Backend uses `semantic === "true"` to switch to vector search.
  const params = {
    ...(debouncedSearch && {
      search: debouncedSearch,
      semantic: semantic ? "true" : "false",
    }),
    ...(activeType !== "all" && { type: activeType }),
    limit: 24,
  };

  const { data, isLoading } = useSaves(params);
  const { data: resurface = [] } = useResurface(3);
  const saves = data?.saves || [];

  const handleCardClick = (save) => {
    // Open side panel on desktop, navigate on mobile (or just always navigate)
    nav(`/saves/${save._id}`);
  };

  return (
    <div className={cn("flex gap-4 h-full", selectedSave && "pr-0")}>
      <div className="flex-1 min-w-0 space-y-4">
        {/* Resurfaced memories */}
        {!debouncedSearch && resurface.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">
              ✨ Resurfaced Memories
            </p>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {resurface.map((s) => (
                <ResurfaceCard key={s._id} save={s} onClick={handleCardClick} />
              ))}
            </div>
          </div>
        )}

        {/* Stats pill when searching */}
        {debouncedSearch && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Searching…" : `${saves.length} result${saves.length !== 1 ? "s" : ""}`}
              {semantic && <span className="ml-1 text-violet-400">(AI semantic)</span>}
            </p>
          </div>
        )}

        {/* Filters (hidden when searching) */}
        {!debouncedSearch && <FilterTabs />}

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => <SaveCardSkeleton key={i} />)}
          </div>
        ) : saves.length === 0 ? (
          <EmptyState
            icon={RiSaveLine}
            title={debouncedSearch ? "No results found" : "No saves yet"}
            description={
              debouncedSearch
                ? semantic
                  ? "Try different keywords or disable AI search."
                  : "Try different keywords or enable AI search."
                : "Save your first link, article, or file to get started."
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {saves.map((save) => (
              <SaveCard key={save._id} save={save} onClick={handleCardClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}