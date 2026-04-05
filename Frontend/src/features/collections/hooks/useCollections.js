// ════════════════════════════════════════════════════════════════════════════
// COLLECTIONS HOOKS  src/features/collections/hooks/useCollections.js
// ════════════════════════════════════════════════════════════════════════════
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { collectionsApi } from "../api/collections.api";

export const useCollections = (params) =>
  useQuery({
    queryKey: ["collections", params],
    queryFn: () => collectionsApi.getAll(params).then((r) => r.data.data),
  });

export const useCollectionById = (id) =>
  useQuery({
    queryKey: ["collection", id],
    queryFn: () => collectionsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCollectionSaves = (id, params) =>
  useQuery({
    queryKey: ["collection-saves", id, params],
    queryFn: () => collectionsApi.getSaves(id, params).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateCollection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: collectionsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection created!");
    },
  });
};

export const useUpdateCollection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...d }) => collectionsApi.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["collections"] }),
  });
};

export const useDeleteCollection = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: collectionsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["collections"] });
      toast.success("Collection deleted");
    },
  });
};
