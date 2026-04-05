// ════════════════════════════════════════════════════════════════════════════
// SAVES HOOKS  src/features/saves/hooks/useSaves.js
// ════════════════════════════════════════════════════════════════════════════
import { useQuery, useMutation, useInfiniteQuery } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { savesApi } from "../api/saves.api";

export const SAVES_KEY = (params) => ["saves", params];

export const useSaves = (params) =>
  useQuery({
    queryKey: SAVES_KEY(params),
    queryFn: () => savesApi.getAll(params).then((r) => r.data.data),
  });

export const useSaveById = (id) =>
  useQuery({
    queryKey: ["save", id],
    queryFn: () => savesApi.getById(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useSaveStats = () =>
  useQuery({
    queryKey: ["saves-stats"],
    queryFn: () => savesApi.getStats().then((r) => r.data.data),
  });

export const useResurface = (count = 3) =>
  useQuery({
    queryKey: ["resurface"],
    queryFn: () => savesApi.getResurface(count).then((r) => r.data.data),
  });

export const useRelatedSaves = (id) =>
  useQuery({
    queryKey: ["related", id],
    queryFn: () => savesApi.getRelated(id).then((r) => r.data.data),
    enabled: !!id,
  });

export const useCreateSave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: savesApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saves"] });
      toast.success("Saved!");
    },
  });
};

export const useUpdateSave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...d }) => savesApi.update(id, d),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ["saves"] });
      qc.invalidateQueries({ queryKey: ["save", id] });
    },
  });
};

export const useDeleteSave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: savesApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saves"] });
      toast.success("Deleted");
    },
  });
};

export const useUploadFile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: savesApi.uploadFile,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saves"] });
      toast.success("File uploaded!");
    },
  });
};

export const useAddHighlight = (saveId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (d) => savesApi.addHighlight(saveId, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["save", saveId] }),
  });
};

export const useDeleteHighlight = (saveId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (hId) => savesApi.delHighlight(saveId, hId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["save", saveId] }),
  });
};


export const useInfiniteSaves = (params) =>
  useInfiniteQuery({
    queryKey: ["saves", params],
    queryFn: ({ pageParam = 1 }) =>
      savesApi.getAll({ ...params, page: pageParam })
        .then((r) => r.data.data),

    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.nextPage : undefined;
    },
});


