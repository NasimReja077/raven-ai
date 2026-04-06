// src/features/saves/pages/SaveDetailPage.jsx
import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
     RiArrowLeftLine, RiExternalLinkLine, RiHeartLine, RiHeartFill,
     RiArchiveLine, RiDeleteBinLine, RiEditLine, RiAddLine, RiCloseLine,
     RiRefreshLine,
} from "react-icons/ri";
import { LuSparkles } from "react-icons/lu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "../../../components/ui/Spinner";
import { EmptyState } from "../../../components/ui/EmptyState";
import ConfirmDialog from "../../../components/common/ConfirmDialog";
import { useSaveById, useUpdateSave, useDeleteSave, useAddHighlight, useDeleteHighlight } from "../hooks/useSaves";
import { cn, timeAgo, fmtDate, TYPE_LABELS, hostname } from "../../../lib/utils";
import toast from "react-hot-toast";
import { savesApi } from "../api/saves.api";

const TYPE_COLORS = {
     youtube: "bg-red-500/15 text-red-400 border-red-500/20",
     tweet: "bg-sky-500/15 text-sky-400 border-sky-500/20",
     github: "bg-neutral-500/15 text-neutral-400 border-neutral-500/20",
     pdf: "bg-orange-500/15 text-orange-400 border-orange-500/20",
     image: "bg-pink-500/15 text-pink-400 border-pink-500/20",
     article: "bg-violet-500/15 text-violet-400 border-violet-500/20",
     link: "bg-blue-500/15 text-blue-400 border-blue-500/20",
};

export default function SaveDetailPage() {
     const { id } = useParams();
     const nav = useNavigate();
     const { data: save, isLoading } = useSaveById(id);
     const { mutate: update } = useUpdateSave();
     const { mutate: del } = useDeleteSave();
     const { mutate: addHL } = useAddHighlight(id);
     const { mutate: delHL } = useDeleteHighlight(id);

     const [highlight, setHighlight] = useState("");
     const [confirmDel, setConfirmDel] = useState(false);
     const [reprocessing, setReprocessing] = useState(false);

     const handleReprocess = async () => {
          try {
               setReprocessing(true);
               await savesApi.reprocess(id, { full: true });
               toast.success("Re-processing queued! Check back in a minute.");
          } catch {
               toast.error("Failed to queue re-processing");
          } finally {
               setReprocessing(false);
          }
     };

     if (isLoading) return (
          <div className="flex items-center justify-center h-64"><Spinner size="lg" /></div>
     );
     if (!save) return (
          <EmptyState title="Save not found" description="This save may have been deleted." />
     );

     const s = save;

     return (
          <motion.div
               initial={{ opacity: 0, y: 8 }}
               animate={{ opacity: 1, y: 0 }}
               className="max-w-4xl mx-auto space-y-6"
          >
               {/* Back + actions bar */}
               <div className="flex items-center justify-between">
                    <button onClick={() => nav(-1)}
                         className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                         <RiArrowLeftLine size={15} /> Back
                    </button>
                    <div className="flex items-center gap-2">
                         <Button size="sm" variant="ghost" className="gap-1.5 text-xs"
                              onClick={() => update({ id, isFavorite: !s.isFavorite })}>
                              {s.isFavorite
                                   ? <RiHeartFill size={13} className="text-red-400" />
                                   : <RiHeartLine size={13} />}
                              {s.isFavorite ? "Unfavorite" : "Favorite"}
                         </Button>
                         <Button size="sm" variant="ghost" className="gap-1.5 text-xs" asChild>
                              <Link to={`/saves/${id}/edit`}><RiEditLine size={13} /> Edit</Link>
                         </Button>
                         <Button size="sm" variant="ghost" className="gap-1.5 text-xs"
                              onClick={handleReprocess} disabled={reprocessing}>
                              <RiRefreshLine size={13} className={reprocessing ? "animate-spin" : ""} />
                              Re-process
                         </Button>
                         <Button size="sm" variant="ghost" className="gap-1.5 text-xs"
                              onClick={() => update({ id, isArchived: !s.isArchived })}>
                              <RiArchiveLine size={13} />
                              {s.isArchived ? "Unarchive" : "Archive"}
                         </Button>
                         <Button size="sm" variant="ghost"
                              className="gap-1.5 text-xs text-destructive hover:text-destructive"
                              onClick={() => setConfirmDel(true)}>
                              <RiDeleteBinLine size={13} /> Delete
                         </Button>
                    </div>
               </div>

               {/* Hero */}
               <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    {s.thumbnail && (
                         <div className="h-52 sm:h-72 overflow-hidden">
                              <img src={s.thumbnail} alt="" className="w-full h-full object-cover" />
                         </div>
                    )}
                    <div className="p-6 space-y-4">
                         {/* Meta row */}
                         <div className="flex items-center gap-2 flex-wrap">
                              <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                                   TYPE_COLORS[s.type] || TYPE_COLORS.link)}>
                                   {TYPE_LABELS[s.type] || s.type}
                              </span>
                              {s.favicon && <img src={s.favicon} alt="" className="w-4 h-4 rounded-sm" />}
                              <span className="text-xs text-muted-foreground">{hostname(s.url)}</span>
                              <span className="text-muted-foreground/40 text-xs">·</span>
                              <span className="text-xs text-muted-foreground">{fmtDate(s.createdAt)}</span>
                              {s.sourceMeta?.readTime && (
                                   <><span className="text-muted-foreground/40 text-xs">·</span>
                                        <span className="text-xs text-muted-foreground">{s.sourceMeta.readTime} min read</span></>
                              )}
                              {s.difficulty && (
                                   <Badge variant="outline" className="text-[10px] h-4 px-1.5">{s.difficulty}</Badge>
                              )}
                         </div>

                         {/* Title */}
                         <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-snug">
                              {s.title}
                         </h1>

                         {/* Short note (AI) */}
                         {s.shortNote && (
                              <div className="flex gap-2.5 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                                   <LuSparkles size={14} className="text-violet-400 mt-0.5 shrink-0" />
                                   <p className="text-sm text-muted-foreground leading-relaxed">{s.shortNote}</p>
                              </div>
                         )}

                         {/* User note */}
                         {s.userNote && (
                              <div className="p-3 rounded-xl bg-muted/40 border border-border">
                                   <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-widest">
                                        Your note
                                   </p>
                                   <p className="text-sm text-foreground leading-relaxed">{s.userNote}</p>
                              </div>
                         )}

                         {/* Open link */}
                         <a href={s.url} target="_blank" rel="noopener noreferrer">
                              <Button size="sm" className="gap-1.5">
                                   <RiExternalLinkLine size={13} /> Open original
                              </Button>
                         </a>
                    </div>
               </div>

               {/* Tags */}
               {s.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                         {s.tags.map((t) => (
                              <Link key={t._id} to={`/tags/${t._id}`}>
                                   <span className="text-xs px-2.5 py-1 rounded-full border font-medium hover:opacity-80 transition-opacity"
                                        style={{ color: t.color, borderColor: `${t.color}40`, background: `${t.color}15` }}>
                                        {t.name}
                                   </span>
                              </Link>
                         ))}
                    </div>
               )}

               {/* Collections */}
               {s.collections?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                         {s.collections.map((c) => (
                              <Link key={c._id} to={`/collections/${c._id}`}>
                                   <Badge variant="secondary" className="text-xs gap-1 hover:opacity-80 transition-opacity cursor-pointer">
                                        {c.name}
                                   </Badge>
                              </Link>
                         ))}
                    </div>
               )}

               {/* Content tabs */}
               <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <Tabs defaultValue="summary" className="p-4">
                         <TabsList className="mb-4">
                              <TabsTrigger value="summary">Summary</TabsTrigger>
                              <TabsTrigger value="highlights">Highlights</TabsTrigger>
                              <TabsTrigger value="ai">AI Insights</TabsTrigger>
                         </TabsList>

                         {/* Summary */}
                         <TabsContent value="summary" className="space-y-4">
                              {s.summary ? (
                                   <p className="text-sm text-muted-foreground leading-relaxed">{s.summary}</p>
                              ) : (
                                   <p className="text-sm text-muted-foreground/50 italic">
                                        AI summary not generated yet.
                                   </p>
                              )}
                              {s.keyPoints?.length > 0 && (
                                   <div>
                                        <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-3 font-semibold">
                                             Key Points
                                        </p>
                                        <ul className="space-y-2">
                                             {s.keyPoints.map((kp, i) => (
                                                  <li key={i} className="flex gap-2.5 text-sm text-muted-foreground">
                                                       <span className="text-violet-400 shrink-0 mt-0.5">•</span>{kp}
                                                  </li>
                                             ))}
                                        </ul>
                                   </div>
                              )}
                         </TabsContent>

                         {/* Highlights */}
                         <TabsContent value="highlights" className="space-y-4">
                              {s.highlights?.length === 0 && (
                                   <p className="text-sm text-muted-foreground/50 italic">No highlights yet.</p>
                              )}
                              <div className="space-y-2">
                                   {s.highlights?.map((h) => (
                                        <div key={h._id}
                                             className="group relative p-3 rounded-xl bg-yellow-500/5 border border-yellow-500/20">
                                             <p className="text-sm text-foreground pr-6">{h.text}</p>
                                             {h.note && (
                                                  <p className="text-xs text-muted-foreground mt-1">{h.note}</p>
                                             )}
                                             <button onClick={() => delHL(h._id)}
                                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1">
                                                  <RiCloseLine size={13} />
                                             </button>
                                        </div>
                                   ))}
                              </div>
                              {/* Add highlight */}
                              <div className="flex gap-2 pt-2">
                                   <Textarea
                                        value={highlight}
                                        onChange={(e) => setHighlight(e.target.value)}
                                        placeholder="Add a highlight or note…"
                                        rows={2}
                                        className="text-sm resize-none"
                                        maxLength={500}
                                   />
                                   <Button size="sm" variant="outline" className="self-end shrink-0"
                                        onClick={() => {
                                             if (highlight.trim()) {
                                                  addHL({ text: highlight.trim() });
                                                  setHighlight("");
                                             }
                                        }}>
                                        <RiAddLine size={14} />
                                   </Button>
                              </div>
                         </TabsContent>

                         {/* AI insights */}
                         <TabsContent value="ai" className="space-y-5">
                              {s.topics?.length > 0 && (
                                   <div>
                                        <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2 font-semibold">Topics</p>
                                        <div className="flex flex-wrap gap-1.5">
                                             {s.topics.map((t) => (
                                                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                                             ))}
                                        </div>
                                   </div>
                              )}
                              {s.keywords?.length > 0 && (
                                   <div>
                                        <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2 font-semibold">Keywords</p>
                                        <div className="flex flex-wrap gap-1.5">
                                             {s.keywords.map((k) => (
                                                  <Badge key={k} variant="outline" className="text-xs">{k}</Badge>
                                             ))}
                                        </div>
                                   </div>
                              )}
                              {s.clusterLabel && (
                                   <div>
                                        <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-2 font-semibold">Cluster</p>
                                        <Badge variant="secondary" className="text-xs gap-1">
                                             <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
                                             {s.clusterLabel}
                                        </Badge>
                                   </div>
                              )}
                              {!s.topics?.length && !s.keywords?.length && (
                                   <p className="text-sm text-muted-foreground/50 italic">
                                        AI insights will appear after processing completes.
                                   </p>
                              )}
                         </TabsContent>
                    </Tabs>
               </div>

               <ConfirmDialog
                    isOpen={confirmDel}
                    title="Delete save?"
                    message="This will permanently remove this save. This cannot be undone."
                    onConfirm={() => { del(id); nav("/"); }}
                    onCancel={() => setConfirmDel(false)}
               />
          </motion.div>
     );
}