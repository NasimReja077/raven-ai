// ════════════════════════════════════════════════════════════════════════════
// TAGS HOOKS  src/features/tags/hooks/useTags.js
// ════════════════════════════════════════════════════════════════════════════
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { tagsApi } from "../api/tags.api";

export const useTags = (params) =>
  useQuery({
    queryKey: ["tags", params],
    queryFn: () => tagsApi.getAll(params).then((r) => r.data.data),
  });

export const useTagById = (id) =>
  useQuery({
    queryKey: ["tag", id],
    queryFn: () => tagsApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useTagSaves = (id, params) =>
  useQuery({
    queryKey: ["tag-saves", id, params],
    queryFn: () => tagsApi.getSaves(id, params).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tagsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag created!");
    },
  });
};

export const useUpdateTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...d }) => tagsApi.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
};

export const useDeleteTag = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: tagsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      toast.success("Tag deleted");
    },
  });
};
