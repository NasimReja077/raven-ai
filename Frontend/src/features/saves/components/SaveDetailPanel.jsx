
// ─── src/features/saves/components/SaveDetailPanel.jsx ───────────────────────
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiCloseLine, RiExternalLinkLine, RiHeartLine, RiHeartFill, RiArchiveLine, RiDeleteBinLine, RiAddLine } from "react-icons/ri";
import { LuSparkles } from "react-icons/lu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge }      from "@/components/ui/badge";
import { Button }     from "@/components/ui/button";
import { Separator }  from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea }   from "@/components/ui/textarea";
import { useAddHighlight, useDeleteHighlight, useUpdateSave, useDeleteSave } from "../hooks/useSaves";
import { useSaveById } from "../hooks/useSaves";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { cn, timeAgo, fmtDate, TYPE_LABELS } from "../../../lib/utils";
import { SaveCardSkeleton } from "../../../components/ui/Skeleton";

export default function SaveDetailPanel({ save: initialSave, onClose }) {
  const { data: save, isLoading } = useSaveById(initialSave?._id);
  const s = save || initialSave;

  const [highlight, setHighlight] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { mutate: addHL }    = useAddHighlight(s?._id);
  const { mutate: delHL }    = useDeleteHighlight(s?._id);
  const { mutate: update }   = useUpdateSave();
  const { mutate: del }      = useDeleteSave();

  if (!s) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 40, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="w-80 shrink-0 border-l border-border bg-card h-full flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-border">
          <div className="flex items-center gap-2">
            {s.favicon && <img src={s.favicon} alt="" className="w-4 h-4 rounded-sm" />}
            <span className="text-xs text-muted-foreground truncate max-w-[160px]">{s.siteName || TYPE_LABELS[s.type]}</span>
          </div>
          <div className="flex items-center gap-1">
            <a href={s.url} target="_blank" rel="noopener noreferrer"
              className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <RiExternalLinkLine size={14} />
            </a>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <RiCloseLine size={14} />
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Thumbnail */}
            {s.thumbnail && <img src={s.thumbnail} alt="" className="w-full h-36 object-cover rounded-lg" />}

            {/* Title */}
            <h2 className="text-sm font-bold text-foreground leading-snug">{s.title}</h2>

            {/* Short note */}
            {s.shortNote && (
              <div className="flex gap-2 p-2.5 rounded-lg bg-muted/40 border border-border">
                <LuSparkles size={13} className="text-violet-400 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">{s.shortNote}</p>
              </div>
            )}

            {/* Meta */}
            <div className="flex flex-wrap gap-1.5 text-[10px] text-muted-foreground">
              <span>{fmtDate(s.createdAt)}</span>
              {s.sourceMeta?.readTime && <><span>·</span><span>{s.sourceMeta.readTime} min read</span></>}
              {s.difficulty && <><span>·</span><Badge variant="outline" className="text-[10px] h-4 px-1.5">{s.difficulty}</Badge></>}
            </div>

            {/* Tags */}
            {s.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {s.tags.map((t) => (
                  <span key={t._id} className="text-[10px] px-2 py-0.5 rounded-full border font-medium"
                    style={{ color: t.color, borderColor: `${t.color}40`, background: `${t.color}15` }}>
                    {t.name}
                  </span>
                ))}
              </div>
            )}

            <Separator />

            {/* Tabs */}
            <Tabs defaultValue="summary">
              <TabsList className="w-full h-7">
                <TabsTrigger value="summary" className="flex-1 text-[10px]">Summary</TabsTrigger>
                <TabsTrigger value="highlights" className="flex-1 text-[10px]">Highlights</TabsTrigger>
                <TabsTrigger value="ai" className="flex-1 text-[10px]">AI</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-3 space-y-3">
                {s.summary
                  ? <p className="text-xs text-muted-foreground leading-relaxed">{s.summary}</p>
                  : <p className="text-xs text-muted-foreground/50 italic">AI summary not yet generated…</p>}
                {s.keyPoints?.length > 0 && (
                  <ul className="space-y-1.5">
                    {s.keyPoints.map((kp, i) => (
                      <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                        <span className="text-violet-400 shrink-0">•</span>{kp}
                      </li>
                    ))}
                  </ul>
                )}
              </TabsContent>

              <TabsContent value="highlights" className="mt-3 space-y-3">
                {s.highlights?.map((h) => (
                  <div key={h._id} className="group relative p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <p className="text-xs text-foreground">{h.text}</p>
                    {h.note && <p className="text-[10px] text-muted-foreground mt-1">{h.note}</p>}
                    <button onClick={() => delHL(h._id)}
                      className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                      <RiCloseLine size={12} />
                    </button>
                  </div>
                ))}
                <div className="flex gap-1.5">
                  <Textarea value={highlight} onChange={(e) => setHighlight(e.target.value)}
                    placeholder="Add a highlight…" rows={2} className="text-xs resize-none" />
                  <Button size="sm" variant="outline" className="self-end"
                    onClick={() => { if (highlight.trim()) { addHL({ text: highlight }); setHighlight(""); } }}>
                    <RiAddLine size={14} />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="ai" className="mt-3 space-y-3">
                {s.topics?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1.5">Topics</p>
                    <div className="flex flex-wrap gap-1">
                      {s.topics.map((t) => <Badge key={t} variant="secondary" className="text-[10px]">{t}</Badge>)}
                    </div>
                  </div>
                )}
                {s.keywords?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1.5">Keywords</p>
                    <div className="flex flex-wrap gap-1">
                      {s.keywords.map((k) => <Badge key={k} variant="outline" className="text-[10px]">{k}</Badge>)}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <Separator />

            {/* Actions */}
            <div className="flex items-center gap-1.5">
              <Button size="sm" variant="ghost" className="gap-1.5 text-xs"
                onClick={() => update({ id: s._id, isFavorite: !s.isFavorite })}>
                {s.isFavorite ? <RiHeartFill size={13} className="text-red-400" /> : <RiHeartLine size={13} />}
                {s.isFavorite ? "Unfave" : "Favorite"}
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 text-xs"
                onClick={() => update({ id: s._id, isArchived: !s.isArchived })}>
                <RiArchiveLine size={13} /> Archive
              </Button>
              <Button size="sm" variant="ghost" className="gap-1.5 text-xs text-destructive hover:text-destructive"
                onClick={() => setConfirmDelete(true)}>
                <RiDeleteBinLine size={13} /> Delete
              </Button>
            </div>
          </div>
        </ScrollArea>

        <ConfirmDialog isOpen={confirmDelete} title="Delete save?" message="This cannot be undone."
          onConfirm={() => { del(s._id); setConfirmDelete(false); onClose(); }}
          onCancel={() => setConfirmDelete(false)} />
      </motion.aside>
    </AnimatePresence>
  );
}