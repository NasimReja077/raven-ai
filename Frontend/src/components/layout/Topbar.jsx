// ─── src/components/layout/Topbar.jsx ────────────────────────────────────────
import { useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RiSearchLine, RiAddLine } from "react-icons/ri";
import { LuSparkles } from "react-icons/lu";
import { setSearch, setSemantic } from "../../app/ui.slice";
import { useDebounce } from "../../hooks/useDebounce";
import { useOnClickOutside } from "../../hooks/useOnClickOutside";
import { Button } from "@/components/common/UI/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import SaveModal from "../../features/saves/components/SaveModal";
import UploadFileModal from "../common/UploadFileModal";
import CreateCollectionModal from "../common/CreateCollectionModal";
import CreateTagModal from "../common/CreateTagModal";
import { cn } from "../../lib/utils";
import {
  RiLinkM,
  RiUpload2Line,
  RiFolderAddLine,
  RiPriceTag3Line,
} from "react-icons/ri";

export default function Topbar() {
  const dispatch = useDispatch();
  const { search, semantic } = useSelector((s) => s.ui);
  const [modal, setModal] = useState(null); // null | "save" | "upload" | "collection" | "tag"

  const handleSearch = (v) => dispatch(setSearch(v));
  const toggleSemantic = () => dispatch(setSemantic(!semantic));

  return (
    <>
      <header className="h-14 border-b border-border flex items-center gap-3 px-4 bg-background/80 backdrop-blur shrink-0">
        {/* Search */}
        <div className="flex-1 max-w-lg relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder={semantic ? "Search by meaning (AI)…" : "Search saves…"}
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className={cn(
              "w-full pl-9 pr-16 py-2 text-sm rounded-lg border bg-muted/40 text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-ring border-input transition-all",
            )}
          />
          <button
            onClick={toggleSemantic}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold px-1.5 py-0.5 rounded border transition-all",
              semantic
                ? "bg-primary text-primary-foreground border-primary"
                : "text-muted-foreground border-border hover:border-primary hover:text-primary",
            )}
          >
            AI
          </button>
        </div>

        {/* + New dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1.5 text-sm font-medium">
              <RiAddLine size={15} /> New
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => setModal("save")}
              className="gap-2"
            >
              <RiLinkM size={14} /> Save URL
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setModal("upload")}
              className="gap-2"
            >
              <RiUpload2Line size={14} /> Upload from PC
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setModal("collection")}
              className="gap-2"
            >
              <RiFolderAddLine size={14} /> Collection
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setModal("tag")} className="gap-2">
              <RiPriceTag3Line size={14} /> Tag
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Modals */}
      <SaveModal isOpen={modal === "save"} onClose={() => setModal(null)} />
      <UploadFileModal
        isOpen={modal === "upload"}
        onClose={() => setModal(null)}
      />
      <CreateCollectionModal
        isOpen={modal === "collection"}
        onClose={() => setModal(null)}
      />
      <CreateTagModal isOpen={modal === "tag"} onClose={() => setModal(null)} />
    </>
  );
}
