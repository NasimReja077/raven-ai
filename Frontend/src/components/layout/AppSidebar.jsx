// src/components/layout/AppSidebar.jsx

import { NavLink, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  RiHome4Line, RiHeartLine, RiArchiveLine, RiShareLine,
  RiApps2Line, RiSettings3Line, RiLogoutBoxLine,
  RiAddCircleLine,
} from "react-icons/ri";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuBadge,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

import { useCollections } from "../../features/collections/hooks/useCollections";
import { useTags } from "../../features/tags/hooks/useTags";
import { useLogout } from "../../features/auth/hooks/useAuth";
import { selectUser } from "../../features/auth/store/auth.slice";
import { getIcon } from "../common/IconMap";
import { cn } from "../../lib/utils";

// ── Nav items
const NAV_MAIN = [
  { label: "All Saves", to: "/",         icon: RiHome4Line, end: true },
  { label: "Favorites", to: "/favorites", icon: RiHeartLine },
  { label: "Graph",     to: "/graph",     icon: RiShareLine },
  { label: "Clusters",  to: "/clusters",  icon: RiApps2Line },
  { label: "Archive",   to: "/archive",   icon: RiArchiveLine },
];

// ── NavItem using shadcn SidebarMenuButton 
function NavItem({ to, icon: Icon, label, end, badge }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <SidebarMenuItem>
      <NavLink to={to} end={end}>
        {({ isActive }) => (
          <SidebarMenuButton
            isActive={isActive}
            tooltip={collapsed ? label : undefined}
            className={cn(
              "gap-3 rounded-xl transition-all font-medium",
              isActive
                ? "bg-sidebar-accent text-sidebar-foreground shadow-sm"
                : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
            )}
          >
            <Icon size={16} className="shrink-0" />
            <span>{label}</span>
            {badge && <SidebarMenuBadge>{badge}</SidebarMenuBadge>}
          </SidebarMenuButton>
        )}
      </NavLink>
    </SidebarMenuItem>
  );
}

// ── Main sidebar 
export default function AppSidebar() {
  const user = useSelector(selectUser);
  const { data: collections = [], isLoading: cLoad } = useCollections();
  const { data: tags = [], isLoading: tLoad } = useTags();
  const { mutate: logout } = useLogout();
  const nav = useNavigate();
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">

      {/* Logo header */}
      <SidebarHeader className="p-3 border-b border-sidebar-border">
        <NavLink to="/" className="flex items-center gap-2.5 px-1 py-1 rounded-xl hover:opacity-80 transition-opacity">
          <img
            src="/Raven AI Logo.png"
            alt="Raven"
            className="h-7 w-7 rounded-xl object-cover shrink-0"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling.style.display = "flex";
            }}
          />
          <div className="hidden h-7 w-7 rounded-xl bg-primary/25 items-center justify-center shrink-0">
            <span className="text-xs font-black text-primary">R</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <span className="font-bold text-sidebar-foreground text-sm tracking-tight">Raven</span>
              <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-bold">AI</span>
            </div>
          )}
        </NavLink>
      </SidebarHeader>

      {/* ── Scrollable content */}
      <SidebarContent>

        {/* Main nav */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_MAIN.map((n) => <NavItem key={n.to} {...n} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="mx-2 my-1 bg-sidebar-border/50" />

        {/* Collections */}
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-[9px] uppercase tracking-widest text-sidebar-foreground/35 font-bold">Collections</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {cLoad ? (
                [...Array(3)].map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <div className="h-8 rounded-xl bg-sidebar-accent/30 animate-pulse mx-1" />
                  </SidebarMenuItem>
                ))
              ) : collections.length === 0 ? (
                !collapsed && <p className="px-3 text-[10px] text-sidebar-foreground/30 py-1">No collections yet</p>
              ) : (
                collections.slice(0, 10).map((col) => (
                  <SidebarMenuItem key={col._id}>
                    <NavLink to={`/collections/${col._id}`}>
                      {({ isActive }) => (
                        <SidebarMenuButton
                          isActive={isActive}
                          tooltip={collapsed ? col.name : undefined}
                          className={cn(
                            "gap-2.5 rounded-xl text-xs",
                            isActive
                              ? "bg-sidebar-accent text-sidebar-foreground"
                              : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                          )}
                        >
                          <span className="text-base leading-none shrink-0">{getIcon(col.icon)}</span>
                          <span className="truncate flex-1">{col.name}</span>
                          {!collapsed && (
                            <SidebarMenuBadge className="text-[9px] text-sidebar-foreground/30">
                              {col.itemCount || 0}
                            </SidebarMenuBadge>
                          )}
                        </SidebarMenuButton>
                      )}
                    </NavLink>
                  </SidebarMenuItem>
                ))
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tags — hide when collapsed */}
        {!collapsed && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-[9px] uppercase tracking-widest text-sidebar-foreground/35 font-bold">Tags</SidebarGroupLabel>
            <SidebarGroupContent>
              {tLoad ? (
                <div className="flex flex-wrap gap-1.5 px-2">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-5 w-12 rounded-full bg-sidebar-accent/30 animate-pulse" />
                  ))}
                </div>
              ) : tags.length === 0 ? (
                <p className="px-3 text-[10px] text-sidebar-foreground/30 py-1">No tags yet</p>
              ) : (
                <div className="flex flex-wrap gap-1 px-2 pb-2">
                  {tags.slice(0, 20).map((tag) => (
                    <NavLink key={tag._id} to={`/tags/${tag._id}`}
                      className={({ isActive }) =>
                        cn("tag-pill transition-all hover:opacity-100",
                          isActive ? "opacity-100 scale-105" : "opacity-60 hover:opacity-80")
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
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* ── Footer: user + logout  */}
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          {/* Profile */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => nav("/profile")}
              tooltip={collapsed ? user?.username : undefined}
              className="gap-2.5 rounded-xl h-auto py-2 hover:bg-sidebar-accent/60"
            >
              <Avatar className="w-6 h-6 shrink-0">
                <AvatarImage src={user?.avatar} key={user?.avatar} />
                <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                  {user?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-medium text-sidebar-foreground/90 truncate leading-none">{user?.username}</p>
                  <p className="text-[9px] text-sidebar-foreground/35 truncate mt-0.5">{user?.email}</p>
                </div>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Settings */}
          <SidebarMenuItem>
            <NavLink to="/settings">
              {({ isActive }) => (
                <SidebarMenuButton
                  isActive={isActive}
                  tooltip={collapsed ? "Settings" : undefined}
                  className="gap-2.5 rounded-xl text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                >
                  <RiSettings3Line size={15} className="shrink-0" />
                  {!collapsed && <span className="text-xs">Settings</span>}
                </SidebarMenuButton>
              )}
            </NavLink>
          </SidebarMenuItem>

          {/* Logout */}
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => logout()}
              tooltip={collapsed ? "Logout" : undefined}
              className="gap-2.5 rounded-xl text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10"
            >
              <RiLogoutBoxLine size={15} className="shrink-0" />
              {!collapsed && <span className="text-xs">Logout</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      {/* Collapse rail */}
      <SidebarRail />
    </Sidebar>
  );
}