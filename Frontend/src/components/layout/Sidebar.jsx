// src/components/layout/Sidebar.jsx
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  RiHome4Line, RiHeartLine, RiArchiveLine, RiShareLine,
  RiApps2Line, RiUserLine, RiSettings3Line,
} from "react-icons/ri";
import { useCollections } from "../../features/collections/hooks/useCollections";
import { useTags } from "../../features/tags/hooks/useTags";
import { useLogout } from "../../features/auth/hooks/useAuth";
import { selectUser } from "../../features/auth/store/auth.slice";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getIcon } from "../common/IconMap";
import { cn } from "../../lib/utils";

const NAV = [
  { label: "All Saves", to: "/", icon: RiHome4Line, end: true },
  { label: "Favorites", to: "/favorites", icon: RiHeartLine },
  { label: "Graph", to: "/graph", icon: RiShareLine },
  { label: "Clusters", to: "/clusters", icon: RiApps2Line },
  { label: "Archive", to: "/archive", icon: RiArchiveLine },
];

function NavItem({ to, icon: Icon, label, end }) {
  return (
    <NavLink to={to} end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all",
          isActive
            ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
            : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
        )
      }>
      <Icon size={16} className="shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="px-3 text-[9px] uppercase tracking-[0.12em] text-sidebar-foreground/35 mb-1.5 font-bold">
      {children}
    </p>
  );
}

export default function Sidebar() {
  const user = useSelector(selectUser);
  const { data: collections = [], isLoading: cLoad } = useCollections();
  const { data: tags = [], isLoading: tLoad } = useTags();
  const { mutate: logout } = useLogout();
  const nav = useNavigate();

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar h-full">
      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <NavLink to="/"
        className="flex items-center gap-2.5 px-4 py-4 border-b border-sidebar-border shrink-0">
        <img
          src="/Raven AI Logo.png"
          alt="Raven"
          className="h-7 w-7 rounded-xl object-cover shadow-md"
          onError={(e) => {
            e.currentTarget.style.display = "none";
            document.getElementById("sb-logo-fb").style.display = "flex";
          }}
        />
        <div id="sb-logo-fb"
          className="hidden h-7 w-7 rounded-xl bg-primary/20 items-center justify-center">
          <span className="text-xs font-black text-primary">R</span>
        </div>
        <span className="font-bold text-sidebar-foreground text-sm tracking-tight">Raven</span>
        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-md bg-primary/15 text-primary font-bold">
          AI
        </span>
      </NavLink>

      <ScrollArea className="flex-1 px-2 py-3">
        {/* ── Main nav ───────────────────────────────────────────────────── */}
        <nav className="space-y-0.5 mb-5">
          {NAV.map((n) => <NavItem key={n.to} {...n} />)}
        </nav>

        {/* ── Collections ────────────────────────────────────────────────── */}
        <div className="mb-5">
          <SectionLabel>Collections</SectionLabel>
          {cLoad ? (
            <div className="space-y-1 px-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-7 rounded-lg bg-sidebar-accent/40 animate-pulse" />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <p className="px-3 text-xs text-sidebar-foreground/35">No collections yet</p>
          ) : (
            <div className="space-y-0.5">
              {collections.slice(0, 10).map((col) => (
                <NavLink key={col._id} to={`/collections/${col._id}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs transition-all",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                    )
                  }>
                  <span className="text-base shrink-0 leading-none">{getIcon(col.icon)}</span>
                  <span className="truncate flex-1">{col.name}</span>
                  <span className="text-[9px] text-sidebar-foreground/30 shrink-0">
                    {col.itemCount || 0}
                  </span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* ── Tags ───────────────────────────────────────────────────────── */}
        <div>
          <SectionLabel>Tags</SectionLabel>
          {tLoad ? (
            <div className="flex flex-wrap gap-1.5 px-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-5 w-12 rounded-full bg-sidebar-accent/40 animate-pulse" />
              ))}
            </div>
          ) : tags.length === 0 ? (
            <p className="px-3 text-xs text-sidebar-foreground/35">No tags yet</p>
          ) : (
            <div className="flex flex-wrap gap-1 px-3">
              {tags.slice(0, 18).map((tag) => (
                <NavLink key={tag._id} to={`/tags/${tag._id}`}
                  className={({ isActive }) =>
                    cn("tag-pill transition-opacity", isActive ? "opacity-100" : "opacity-60 hover:opacity-90")
                  }
                  style={{
                    color: tag.color,
                    borderColor: `${tag.color}40`,
                    background: `${tag.color}12`,
                  }}>
                  {tag.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ── Bottom user row ────────────────────────────────────────────── */}
      <div className="border-t border-sidebar-border p-2 shrink-0">
        <div className="flex items-center gap-2 px-1">
          {/* Avatar → profile */}
          <button onClick={() => nav("/profile")}
            className="flex items-center gap-2 flex-1 min-w-0 rounded-xl py-1.5 px-2 hover:bg-sidebar-accent/60 transition-colors">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarImage src={user?.avatar} key={user?.avatar} />
              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                {user?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground/90 truncate leading-none">
                {user?.username}
              </p>
              <p className="text-[9px] text-sidebar-foreground/35 truncate mt-0.5">
                {user?.email}
              </p>
            </div>
          </button>

          {/* Settings */}
          <Tooltip>
            <TooltipTrigger asChild>
              <NavLink to="/settings"
                className={({ isActive }) =>
                  cn("p-1.5 rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-foreground"
                      : "text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50")
                }>
                <RiSettings3Line size={14} />
              </NavLink>
            </TooltipTrigger>
            <TooltipContent side="top">Settings</TooltipContent>
          </Tooltip>

          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button onClick={() => logout()}
                className="p-1.5 rounded-lg text-sidebar-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">Logout</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </aside>
  );
}