// ─── src/features/saves/pages/ArchivePage.jsx ────────────────────────────────
import { useSaves, useUpdateSave } from "../hooks/useSaves";
import SaveCard from "../../../components/common/SaveCard";
import { SaveCardSkeleton } from "../../../components/ui/SaveCardSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Button } from "@/components/ui/button";
import { RiArchiveLine } from "react-icons/ri";
import { useState } from "react";
import SaveDetailPanel from "../components/SaveDetailPanel";

export default function ArchivePage() {
     const { data, isLoading } = useSaves({ isArchived: "true", limit: 50 });
     const { mutate: updateSave } = useUpdateSave();
     const [sel, setSel] = useState(null);
     const saves = data?.saves || [];

     return (
          <div className="flex gap-4">
               <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                         <h1 className="text-lg font-bold text-foreground">Archive</h1>
                         <span className="text-xs text-muted-foreground">{saves.length} items</span>
                    </div>
                    {isLoading
                         ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{[...Array(4)].map((_, i) => <SaveCardSkeleton key={i} />)}</div>
                         : saves.length === 0
                              ? <EmptyState icon={RiArchiveLine} title="Archive is empty" description="Archived saves will appear here." />
                              : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                                   {saves.map((s) => (
                                        <div key={s._id} className="relative">
                                             <SaveCard save={s} onClick={setSel} />
                                             <Button size="sm" variant="secondary" className="absolute top-2 left-2 text-[10px] h-6 px-2 z-10"
                                                  onClick={(e) => { e.stopPropagation(); updateSave({ id: s._id, isArchived: false }); }}>
                                                  Restore
                                             </Button>
                                        </div>
                                   ))}
                              </div>
                    }
               </div>
               {sel && <SaveDetailPanel save={sel} onClose={() => setSel(null)} />}
          </div>
     );
}
