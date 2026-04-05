// ════════════════════════════════════════════════════════════════════════════
// GRAPH HOOK  src/features/graph/hooks/useGraph.js
// ════════════════════════════════════════════════════════════════════════════
import { useQuery } from "@tanstack/react-query";
import { graphApi } from "../api/graph.api";

export const useGraph = () =>
  useQuery({
    queryKey: ["graph"],
    queryFn: () => graphApi.get().then((r) => r.data.data),
    staleTime: 1000 * 60 * 5,
  });
