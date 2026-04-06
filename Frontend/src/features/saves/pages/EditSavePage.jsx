// src/features/saves/pages/EditSavePage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { RiArrowLeftLine, RiSaveLine, RiCloseLine } from "react-icons/ri";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "../../../components/ui/Spinner";
import { useSaveById, useUpdateSave } from "../hooks/useSaves";
import { useTags } from "../../tags/hooks/useTags";
import { useCollections } from "../../collections/hooks/useCollections";
import { savesApi } from "../api/saves.api";
import { tagsApi } from "../../tags/api/tags.api";
import { collectionsApi } from "../../collections/api/collections.api";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

const schema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  userNote: z.string().max(1000).optional(),
});

export default function EditSavePage() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const { data: save, isLoading } = useSaveById(id);
  const { data: allTags = [] } = useTags();
  const { data: allCollections = [] } = useCollections();
  const { mutate: update, isPending } = useUpdateSave();

  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedCollections, setSelectedCollections] = useState([]);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
  });

  // Pre-fill form when save loads
  useEffect(() => {
    if (save) {
      reset({ title: save.title, userNote: save.userNote || "" });
      setSelectedTags(save.tags?.map((t) => t._id) || []);
      setSelectedCollections(save.collections?.map((c) => c._id) || []);
    }
  }, [save, reset]);

  const toggleTag = (tagId) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const toggleCollection = (colId) => {
    setSelectedCollections((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId]
    );
  };

  const onSubmit = async (data) => {
    try {
      setSaving(true);
      // Update basic fields via PATCH
      await savesApi.update(id, {
        title: data.title,
        userNote: data.userNote,
      });

      // Sync tags: remove old, add new
      const currentTagIds = save.tags?.map((t) => t._id) || [];
      const tagsToRemove = currentTagIds.filter((t) => !selectedTags.includes(t));
      const tagsToAdd    = selectedTags.filter((t) => !currentTagIds.includes(t));
      await Promise.all([
        ...tagsToRemove.map((tid) => tagsApi.removeFromSave(tid, id)),
        ...tagsToAdd.map((tid) => tagsApi.addToSave(tid, id)),
      ]);

      // Sync collections: remove old, add new
      const currentColIds = save.collections?.map((c) => c._id) || [];
      const colsToRemove = currentColIds.filter((c) => !selectedCollections.includes(c));
      const colsToAdd    = selectedCollections.filter((c) => !currentColIds.includes(c));
      await Promise.all([
        ...colsToRemove.map((cid) => savesApi.removeFromColl(id, cid)),
        ...colsToAdd.map((cid) => savesApi.addToCollection(id, { collectionId: cid })),
      ]);

      qc.invalidateQueries({ queryKey: ["save", id] });
      qc.invalidateQueries({ queryKey: ["saves"] });
      toast.success("Save updated!");
      nav(`/saves/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update save");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading)
    return <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => nav(-1)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <RiArrowLeftLine size={15} /> Back
        </button>
        <h1 className="text-lg font-bold text-foreground">Edit Save</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Title */}
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input {...register("title")} placeholder="Title" />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>

        {/* URL (read-only) */}
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">URL (read-only)</Label>
          <Input value={save?.url || ""} readOnly className="opacity-60 cursor-not-allowed" />
        </div>

        {/* User note */}
        <div className="space-y-1.5">
          <Label>Note</Label>
          <Textarea {...register("userNote")} rows={3} placeholder="Why did you save this?"
            maxLength={1000} className="resize-none" />
        </div>

        {/* Tags */}
        <div className="space-y-2">
          <Label>Tags</Label>
          {allTags.length === 0 ? (
            <p className="text-xs text-muted-foreground">No tags yet. Create one from the topbar.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border bg-muted/30">
              {allTags.map((tag) => {
                const active = selectedTags.includes(tag._id);
                return (
                  <button key={tag._id} type="button" onClick={() => toggleTag(tag._id)}
                    className="text-xs px-2.5 py-1 rounded-full border font-medium transition-all"
                    style={{
                      color: active ? "#fff" : tag.color,
                      borderColor: active ? tag.color : `${tag.color}40`,
                      background: active ? tag.color : `${tag.color}15`,
                    }}>
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Collections */}
        <div className="space-y-2">
          <Label>Collections</Label>
          {allCollections.length === 0 ? (
            <p className="text-xs text-muted-foreground">No collections yet.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5 p-3 rounded-xl border border-border bg-muted/30">
              {allCollections.map((col) => {
                const active = selectedCollections.includes(col._id);
                return (
                  <button key={col._id} type="button" onClick={() => toggleCollection(col._id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                      active
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-transparent text-foreground border-border hover:border-primary/50"
                    }`}>
                    {col.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button type="submit" className="gap-1.5" disabled={saving}>
            <RiSaveLine size={14} />
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <Button type="button" variant="outline" onClick={() => nav(-1)}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}