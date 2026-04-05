// ─── src/components/common/FilterTabs.jsx ────────────────────────────────────
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDispatch, useSelector } from "react-redux";
import { setActiveType } from "../../../app/ui.slice";

const TYPES = [
  { value: "all",     label: "All" },
  { value: "article", label: "Articles" },
  { value: "youtube", label: "Videos" },
  { value: "tweet",   label: "Tweets" },
  { value: "pdf",     label: "PDFs" },
  { value: "github",  label: "GitHub" },
  { value: "image",   label: "Images" },
];

export default function FilterTabs() {
  const dispatch = useDispatch();
  const active   = useSelector((s) => s.ui.activeType);

  return (
    <Tabs value={active} onValueChange={(v) => dispatch(setActiveType(v))}>
      <TabsList className="h-8 gap-0.5 bg-muted/50">
        {TYPES.map((t) => (
          <TabsTrigger key={t.value} value={t.value} className="text-xs px-3 h-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}