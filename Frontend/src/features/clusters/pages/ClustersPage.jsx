// src/features/clusters/pages/ClustersPage.jsx


import { useState } from "react";
import {
  useClusters,
  useRunClustering,
  useClusterSaves,
} from "../hooks/useClusters";
import { SaveCardSkeleton } from "../../../components/ui/skeleton";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Spinner } from "../../../components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import SaveCard from "../../../components/common/SaveCard";
import SaveDetailPanel from "../../saves/components/SaveDetailPanel";
import {
  RiApps2Line,
  RiRefreshLine,
  RiArrowDownSLine,
  RiArrowUpSLine,
} from "react-icons/ri";
import { useNavigate } from "react-router-dom";
import { cn } from "../../../lib/utils";

const CLUSTER_COLORS = [
  "#7c3aed",
  "#0891b2",
  "#16a34a",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#7e22ce",
  "#0e7490",
];
const clusterColor = (id = "") => {
  let hash = 0;
  for (const c of id) hash = (hash << 5) - hash + c.charCodeAt(0);
  return CLUSTER_COLORS[Math.abs(hash) % CLUSTER_COLORS.length];
};

function ClusterSaves({ clusterId, onSelect }) {
  const { data, isLoading } = useClusterSaves(clusterId);
  const saves = data?.saves || [];
  if (isLoading)
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3">
        {[...Array(4)].map((_, i) => (
          <SaveCardSkeleton key={i} />
        ))}
      </div>
    );
  if (!saves.length)
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        No saves in this cluster.
      </p>
    );
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-3">
      {saves.map((s) => (
        <SaveCard key={s._id} save={s} onClick={onSelect} />
      ))}
    </div>
  );
}

export default function ClustersPage() {
  const { data: clusters = [], isLoading, error } = useClusters();
  const { mutate: runKMeans, isPending: running } = useRunClustering();
  const [expanded, setExpanded] = useState(null);
  const [selectedSave, setSelectedSave] = useState(null);
  const nav = useNavigate();

  const toggle = (id) => setExpanded((p) => (p === id ? null : id));

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" />
      </div>
    );

  return (
    <div className="flex gap-4">
      <div className="flex-1 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">Clusters</h1>
            <p className="text-xs text-muted-foreground">
              AI-grouped topics · {clusters.length} cluster
              {clusters.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => runKMeans({ k: 6 })}
            disabled={running}
            className="gap-1.5"
          >
            <RiRefreshLine
              size={13}
              className={running ? "animate-spin" : ""}
            />
            {running ? "Clustering…" : "Re-cluster"}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-sm text-destructive">
            Failed to load clusters.
          </div>
        )}

        {/* Empty */}
        {!error && clusters.length === 0 && (
          <EmptyState
            icon={RiApps2Line}
            title="No clusters yet"
            description="Save at least 5 items, process them, then click Re-cluster."
            action={
              <Button
                size="sm"
                onClick={() => runKMeans({ k: 6 })}
                disabled={running}
                className="gap-1.5 mt-2"
              >
                <RiRefreshLine
                  size={13}
                  className={running ? "animate-spin" : ""}
                />
                {running ? "Clustering…" : "Run now"}
              </Button>
            }
          />
        )}

        {/* Cluster list */}
        <div className="space-y-2">
          {clusters.map((cluster, idx) => {
            const color = clusterColor(cluster.clusterId);
            const isOpen = expanded === cluster.clusterId;
            return (
              <div
                key={cluster.clusterId}
                className="border border-border rounded-2xl bg-card overflow-hidden"
                style={{ borderLeftColor: color, borderLeftWidth: "3px" }}
              >
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/20 transition-colors text-left"
                  onClick={() => toggle(cluster.clusterId)}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${color}18` }}
                    >
                      <RiApps2Line size={17} style={{ color }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {cluster.label || `Cluster ${idx + 1}`}
                      </p>
                      {cluster.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {cluster.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <Badge variant="secondary" className="text-xs">
                      {cluster.itemCount} saves
                    </Badge>
                    {isOpen ? (
                      <RiArrowUpSLine
                        size={14}
                        className="text-muted-foreground"
                      />
                    ) : (
                      <RiArrowDownSLine
                        size={14}
                        className="text-muted-foreground"
                      />
                    )}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-border/40 bg-muted/10">
                    <ClusterSaves
                      clusterId={cluster.clusterId}
                      onSelect={(s) => nav(`/saves/${s._id}`)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {selectedSave && (
        <SaveDetailPanel
          save={selectedSave}
          onClose={() => setSelectedSave(null)}
        />
      )}
    </div>
  );
}
