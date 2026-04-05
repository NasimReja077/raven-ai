

// ─── src/components/common/UploadFileModal.jsx ───────────────────────────────
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useUploadFile } from "../../features/saves/hooks/useSaves";
import { RiUpload2Line, RiFileLine } from "react-icons/ri";
import { cn } from "../../lib/utils";

export default function UploadFileModal({ isOpen, onClose }) {
  const [file, setFile]   = useState(null);
  const [note, setNote]   = useState("");
  const { mutate, isPending } = useUploadFile();

  const onDrop = useCallback((accepted) => { if (accepted[0]) setFile(accepted[0]); }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, maxFiles: 1, accept: { "image/*": [], "application/pdf": [".pdf"] },
  });

  const close = () => { setFile(null); setNote(""); onClose(); };
  const handleSubmit = () => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    if (note) fd.append("userNote", note);
    mutate(fd, { onSuccess: close });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>Upload from PC</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div {...getRootProps()}
            className={cn("border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors",
              isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-border/70 hover:bg-muted/30",
              file && "border-green-500/50 bg-green-500/5"
            )}>
            <input {...getInputProps()} />
            {file
              ? <div className="flex flex-col items-center gap-2">
                  <RiFileLine size={28} className="text-green-400" />
                  <p className="text-sm text-foreground font-medium truncate max-w-[200px]">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              : <div className="flex flex-col items-center gap-2">
                  <RiUpload2Line size={28} className="text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">{isDragActive ? "Drop it here" : "Drag & drop or click to upload"}</p>
                  <p className="text-xs text-muted-foreground/60">PDF or Image (max 20MB)</p>
                </div>
            }
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Note <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note about this file…" maxLength={1000} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={close}>Cancel</Button>
            <Button size="sm" disabled={!file || isPending} onClick={handleSubmit}>
              {isPending ? "Uploading…" : "Upload & Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}