// ─── src/features/saves/pages/AllSavesPage.jsx ───────────────────────────────
import { useState } from "react";
import { useSelector } from "react-redux";
import { useSaves, useSaveStats, useResurface } from "../hooks/useSaves";
import { useDebounce } from "../../../hooks/useDebounce";
import SaveCard from "../../../components/common/SaveCard";
import FilterTabs from "../../../components/common/FilterTabs";
import { SaveCardSkeleton } from "../../../components/ui/Skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import SaveDetailPanel from "../components/SaveDetailPanel";
import ResurfaceCard from "../components/ResurfaceCard";
import { RiSaveLine } from "react-icons/ri";
import { cn } from "../../../lib/utils";

export default function AllSavesPage() {
     const { search, semantic, activeType } = useSelector((s) => s.ui);
     const debouncedSearch = useDebounce(search, 400);
     const [selectedSave, setSelectedSave] = useState(null);

     const params = {
          ...(debouncedSearch && { search: debouncedSearch, semantic: semantic ? "true" : "false" }),
          ...(activeType !== "all" && { type: activeType }),
          limit: 24,
     };

     const { data, isLoading } = useSaves(params);
     const { data: resurface = [] } = useResurface(3);
     const saves = data?.saves || [];

     return (
          <div className={cn("flex gap-4 h-full", selectedSave && "pr-0")}>
               <div className="flex-1 min-w-0 space-y-4">
                    {/* Resurfaced memories */}
                    {!debouncedSearch && resurface.length > 0 && (
                         <div>
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2">✨ Resurfaced Memories</p>
                              <div className="flex gap-3 overflow-x-auto pb-1">
                                   {resurface.map((s) => <ResurfaceCard key={s._id} save={s} onClick={setSelectedSave} />)}
                              </div>
                         </div>
                    )}

                    {/* Filters */}
                    <FilterTabs />

                    {/* Grid */}
                    {isLoading ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {[...Array(8)].map((_, i) => <SaveCardSkeleton key={i} />)}
                         </div>
                    ) : saves.length === 0 ? (
                         <EmptyState icon={RiSaveLine} title="No saves yet"
                              description={debouncedSearch ? "No results found. Try different keywords." : "Save your first link, article, or file to get started."} />
                    ) : (
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {saves.map((save) => (
                                   <SaveCard key={save._id} save={save} onClick={setSelectedSave} />
                              ))}
                         </div>
                    )}
               </div>

               {/* Detail panel */}
               {selectedSave && (
                    <SaveDetailPanel save={selectedSave} onClose={() => setSelectedSave(null)} />
               )}
          </div>
     );
}