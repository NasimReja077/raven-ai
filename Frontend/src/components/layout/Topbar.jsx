// src/components/layout/Topbar.jsx
import { useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  RiSearchLine,
  RiAddLine,
  RiLinkM,
  RiUpload2Line,
  RiFolderAddLine,
  RiPriceTag3Line,
  RiMoonLine,
  RiSunLine,
} from "react-icons/ri";
import { HiOutlineSparkles } from "react-icons/hi2";
import { setSearch, setSemantic } from "../../app/ui.slice";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import SaveModal from "../../features/saves/components/SaveModal";
import UploadFileModal from "../common/UploadFileModal";
import CreateCollectionModal from "../common/CreateCollectionModal";
import CreateTagModal from "../common/CreateTagModal";
import { cn } from "../../lib/utils";

function useTheme() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  const toggle = useCallback(() => {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("raven-theme", next ? "dark" : "light");
    setDark(next);
  }, [dark]);
  return { dark, toggle };
}

export default function Topbar() {
  const dispatch = useDispatch();
  const { search, semantic } = useSelector((s) => s.ui);
  const [modal, setModal] = useState(null);
  const { dark, toggle } = useTheme();

  return (
    <>
      <header className="h-14 border-b border-border flex items-center gap-2 px-3 bg-background/90 backdrop-blur-sm shrink-0 z-10 sticky top-0">
        {/* Sidebar toggle (shadcn) */}
        <SidebarTrigger className="text-muted-foreground hover:text-foreground shrink-0" />
        <Separator orientation="vertical" className="h-5 mx-0.5" />

        {/* Search */}
        <div className="flex-1 max-w-xl relative">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5 pointer-events-none" />
          <input
            type="text"
            placeholder={
              semantic ? "Describe what you saved… (AI)" : "Search saves…"
            }
            value={search}
            onChange={(e) => dispatch(setSearch(e.target.value))}
            className={cn(
              "w-full pl-8 pr-20 py-1.5 text-sm rounded-xl border bg-muted/50 text-foreground",
              "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring",
              "border-input transition-all",
              semantic && "border-primary/50 bg-primary/5",
            )}
          />
          {/* AI toggle pill */}
          <button
            onClick={() => dispatch(setSemantic(!semantic))}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-lg border transition-all",
              semantic
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "text-muted-foreground border-border hover:border-primary/50 hover:text-primary",
            )}
          >
            <HiOutlineSparkles size={10} />
            AI
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Theme toggle */}
          <button
            onClick={toggle}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
            title={dark ? "Light mode" : "Dark mode"}
          >
            {dark ? <RiSunLine size={15} /> : <RiMoonLine size={15} />}
          </button>

          {/* New dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                className="gap-1.5 text-xs font-semibold h-8 px-3 rounded-xl"
              >
                <RiAddLine size={14} /> New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                Create
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setModal("save")}
                className="gap-2 text-sm cursor-pointer"
              >
                <RiLinkM size={13} /> Save URL
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setModal("upload")}
                className="gap-2 text-sm cursor-pointer"
              >
                <RiUpload2Line size={13} /> Upload file
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setModal("collection")}
                className="gap-2 text-sm cursor-pointer"
              >
                <RiFolderAddLine size={13} /> New collection
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setModal("tag")}
                className="gap-2 text-sm cursor-pointer"
              >
                <RiPriceTag3Line size={13} /> New tag
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
