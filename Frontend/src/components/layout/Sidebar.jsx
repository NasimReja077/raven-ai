// ─── src/components/layout/Sidebar.jsx ───────────────────────────────────────
import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useState } from "react";
import {
  RiHome4Line,
  RiHeartLine,
  RiArchiveLine,
  RiShareLine,
  RiApps2Line,
  RiSettings4Line,
} from "react-icons/ri";
import { LuSparkles } from "react-icons/lu";
import { useCollections } from "../../features/collections/hooks/useCollections";
import { useTags } from "../../features/tags/hooks/useTags";
import { useLogout } from "../../features/auth/hooks/useAuth";
import { selectUser } from "../../features/auth/store/auth.slice";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/common/UI/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/common/UI/tooltip";
import { COLLECTION_ICONS, getIcon } from "../common/common/IconMap";
import { cn } from "../../lib/utils";

const NAV = [
  { label: "All Saves", to: "/", icon: RiHome4Line, end: true },
  { label: "Favorites", to: "/favorites", icon: RiHeartLine },
  { label: "Graph", to: "/graph", icon: RiShareLine },
  { label: "Clusters", to: "/clusters", icon: RiApps2Line },
  { label: "Archive", to: "/archive", icon: RiArchiveLine },
];

const NavItem = ({ to, icon: Icon, label, end }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-sidebar-primary-foreground"
          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
      )
    }
  >
    <Icon size={16} />
    <span>{label}</span>
  </NavLink>
);

export default function Sidebar() {
  const user = useSelector(selectUser);
  const { data: collections = [], isLoading: cLoad } = useCollections();
  const { data: tags = [], isLoading: tLoad } = useTags();
  const { mutate: logout } = useLogout();

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-sidebar-border bg-sidebar h-full">
      {/* Logo */}
      <NavLink
        to="/"
        className="flex items-center gap-2 px-4 py-4 border-b border-sidebar-border"
      >
        <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-sm font-black text-white">
          R
        </div>
        <span className="font-bold text-sidebar-foreground text-sm tracking-wide">
          Raven
        </span>
      </NavLink>

      <ScrollArea className="flex-1 px-2 py-3">
        {/* Main nav */}
        <nav className="space-y-0.5">
          {NAV.map((n) => (
            <NavItem key={n.to} {...n} />
          ))}
        </nav>

        {/* Collections */}
        <div className="mt-5">
          <p className="px-3 text-[10px] uppercase tracking-widest text-sidebar-foreground/40 mb-1.5 font-semibold">
            Collections
          </p>
          {cLoad ? (
            <div className="px-3 text-xs text-sidebar-foreground/40">
              Loading...
            </div>
          ) : collections.length === 0 ? (
            <div className="px-3 text-xs text-sidebar-foreground/40">
              No collections yet
            </div>
          ) : (
            <div className="space-y-0.5">
              {collections.slice(0, 12).map((col) => (
                <NavLink
                  key={col._id}
                  to={`/collections/${col._id}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )
                  }
                >
                  <span className="text-sm">{getIcon(col.icon)}</span>
                  <span className="truncate flex-1">{col.name}</span>
                  <span className="text-[10px] text-sidebar-foreground/40">
                    {col.itemCount || 0}
                  </span>
                </NavLink>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="mt-5">
          <p className="px-3 text-[10px] uppercase tracking-widest text-sidebar-foreground/40 mb-1.5 font-semibold">
            Tags
          </p>
          {tLoad ? (
            <div className="px-3 text-xs text-sidebar-foreground/40">
              Loading...
            </div>
          ) : tags.length === 0 ? (
            <div className="px-3 text-xs text-sidebar-foreground/40">
              No tags yet
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 px-3">
              {tags.slice(0, 20).map((tag) => (
                <NavLink
                  key={tag._id}
                  to={`/tags/${tag._id}`}
                  className={({ isActive }) =>
                    cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors",
                      isActive ? "opacity-100" : "opacity-70 hover:opacity-100",
                    )
                  }
                  style={{
                    color: tag.color,
                    borderColor: `${tag.color}40`,
                    background: `${tag.color}15`,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: tag.color }}
                  />
                  {tag.name}
                </NavLink>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Bottom: user */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center gap-2">
          <NavLink
            to="/settings"
            className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity"
          >
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="text-xs bg-white/10 text-white">
                {user?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-sidebar-foreground/80 truncate">
              {user?.username}
            </span>
          </NavLink>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => logout()}
                className="p-1.5 rounded text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
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
