// src/components/common/FilterTabs.jsx

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDispatch, useSelector } from "react-redux";
import { setActiveType } from "../../app/ui.slice";

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
    <div className="flex justify-center w-full">
      <Tabs value={active} onValueChange={(v) => dispatch(setActiveType(v))}>
        <TabsList className="h-9 gap-0.5 bg-muted/50 px-1">
          {TYPES.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="text-xs px-4 h-7 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}