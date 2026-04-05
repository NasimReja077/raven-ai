// ════════════════════════════════════════════════════════════════════════════
// CLUSTERS HOOK  src/features/clusters/hooks/useClusters.js
// ════════════════════════════════════════════════════════════════════════════
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { clustersApi } from "../api/clusters.api";

export const useClusters = () =>
  useQuery({
    queryKey: ["clusters"],
    queryFn: () => clustersApi.getAll().then((r) => r.data.data),
  });

export const useClusterSaves = (id, params) =>
  useQuery({
    queryKey: ["cluster-saves", id],
    queryFn: () => clustersApi.getSaves(id, params).then((r) => r.data.data),
    enabled: !!id,
  });

export const useRunClustering = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clustersApi.runKMeans,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["clusters"] });
      toast.success("Clustering complete!");
    },
  });
};
