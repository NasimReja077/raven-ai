// src/features/user/pages/ProfilePage.jsx
import { useSelector } from "react-redux";
import { selectUser } from "../../auth/store/auth.slice";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useSaveStats } from "../../saves/hooks/useSaves";
import { useTags } from "../../tags/hooks/useTags";
import { useCollections } from "../../collections/hooks/useCollections";
import { fmtDate } from "../../../lib/utils";
import { RiSettingsLine, RiSaveLine, RiPriceTag3Line, RiFolderLine } from "react-icons/ri";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col items-center gap-1 p-4 rounded-xl bg-muted/30 border border-border flex-1 min-w-0">
      <Icon size={18} className="text-muted-foreground" />
      <p className="text-xl font-bold text-foreground">{value ?? "—"}</p>
      <p className="text-xs text-muted-foreground text-center">{label}</p>
    </div>
  );
}

export default function ProfilePage() {
  const user = useSelector(selectUser);
  const { data: stats } = useSaveStats();
  const { data: tags = [] } = useTags();
  const { data: collections = [] } = useCollections();

  if (!user) return null;

  const topTypes = stats?.typeBreakdown?.slice(0, 4) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar} key={user.avatar} />
              <AvatarFallback className="text-xl">
                {user.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-bold text-foreground">{user.username}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Member since {fmtDate(user.createdAt)}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" asChild className="gap-1.5">
            <Link to="/settings"><RiSettingsLine size={13} /> Settings</Link>
          </Button>
        </div>

        <Separator />

        {/* Stats row */}
        <div className="flex gap-3">
          <StatCard icon={RiSaveLine}    label="Total saves"   value={stats?.total} />
          <StatCard icon={RiPriceTag3Line} label="Tags"        value={tags.length} />
          <StatCard icon={RiFolderLine}  label="Collections"   value={collections.length} />
          <StatCard icon={RiSaveLine}    label="Favorites"     value={stats?.favorites} />
        </div>
      </div>

      {/* Content types breakdown */}
      {topTypes.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">What you save</h2>
          <div className="space-y-2">
            {topTypes.map(({ _id: type, count }) => {
              const pct = stats?.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-16 capitalize">{type || "other"}</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent tags */}
      {tags.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Your tags</h2>
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 20).map((tag) => (
              <Link key={tag._id} to={`/tags/${tag._id}`}>
                <span className="text-xs px-2.5 py-1 rounded-full border font-medium hover:opacity-80 transition-opacity"
                  style={{ color: tag.color, borderColor: `${tag.color}40`, background: `${tag.color}15` }}>
                  {tag.name}
                  {tag.saveCount > 0 && (
                    <span className="ml-1 opacity-60">{tag.saveCount}</span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Collections */}
      {collections.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Collections</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {collections.slice(0, 9).map((col) => (
              <Link key={col._id} to={`/collections/${col._id}`}
                className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-accent/30 transition-colors text-sm truncate">
                <span className="shrink-0">{col.icon || "📁"}</span>
                <span className="truncate text-foreground text-xs">{col.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground shrink-0">{col.itemCount}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}