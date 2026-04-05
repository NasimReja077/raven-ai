
// ─── src/features/clusters/pages/ClustersPage.jsx ────────────────────────────
import { useState } from "react";
import { useClusters, useRunClustering, useClusterSaves } from "../hooks/useClusters";
import { SaveCardSkeleton } from "../../../components/ui/SaveCardSkeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Spinner } from "../../../components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SaveCard from "../../../components/common/SaveCard";
import { RiApps2Line, RiRefreshLine } from "react-icons/ri";

function ClusterSaves({ clusterId }) {
  const { data, isLoading } = useClusterSaves(clusterId);
  const saves = data?.saves || [];
  if (isLoading) return <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{[...Array(3)].map((_, i) => <SaveCardSkeleton key={i} />)}</div>;
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {saves.map((s) => <SaveCard key={s._id} save={s} />)}
    </div>
  );
}

export default function ClustersPage() {
  const { data: clusters = [], isLoading } = useClusters();
  const { mutate: runKMeans, isPending: running } = useRunClustering();
  const [expanded, setExpanded] = useState(null);

  if (isLoading) return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Clusters</h1>
          <p className="text-xs text-muted-foreground">AI-grouped topics across your saves</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => runKMeans({ k: 6 })} disabled={running}
          className="gap-1.5">
          <RiRefreshLine size={14} className={running ? "animate-spin" : ""} />
          {running ? "Clustering…" : "Re-cluster"}
        </Button>
      </div>

      {clusters.length === 0 ? (
        <EmptyState icon={RiApps2Line} title="No clusters yet"
          description="Save at least 5 links and click Re-cluster to group them by topic." />
      ) : (
        <div className="space-y-3">
          {clusters.map((cluster) => (
            <div key={cluster.clusterId} className="border border-border rounded-xl bg-card overflow-hidden">
              <button className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors text-left"
                onClick={() => setExpanded(expanded === cluster.clusterId ? null : cluster.clusterId)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <RiApps2Line size={16} className="text-violet-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{cluster.label || cluster.clusterId}</p>
                    {cluster.description && <p className="text-xs text-muted-foreground">{cluster.description}</p>}
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">{cluster.itemCount} saves</Badge>
              </button>

              {expanded === cluster.clusterId && (
                <div className="px-4 pb-4">
                  <ClusterSaves clusterId={cluster.clusterId} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}