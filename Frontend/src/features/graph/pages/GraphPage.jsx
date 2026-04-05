// ─── src/features/graph/pages/GraphPage.jsx ──────────────────────────────────
import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { useGraph } from "../hooks/useGraph";
import { Spinner } from "../../../components/ui/Spinner";
import { EmptyState } from "../../../components/ui/EmptyState";
import { RiShareLine } from "react-icons/ri";

const LINK_COLORS = {
  "shared-tag":   "#a78bfa",
  "same-cluster": "#38bdf8",
  "embedding":    "#4ade80",
};

export default function GraphPage() {
  const { data, isLoading } = useGraph();
  const svgRef = useRef(null);

  useEffect(() => {
    if (!data?.nodes?.length || !svgRef.current) return;

    const el = svgRef.current;
    const W = el.clientWidth  || 900;
    const H = el.clientHeight || 600;

    // Clear previous render
    d3.select(el).selectAll("*").remove();

    const svg = d3.select(el)
      .append("svg").attr("width", W).attr("height", H)
      .call(d3.zoom().scaleExtent([0.2, 4]).on("zoom", (e) => g.attr("transform", e.transform)));

    const g = svg.append("g");

    const nodes = data.nodes.map((n) => ({ ...n }));
    const links = data.links.map((l) => ({ ...l }));

    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(links).id((d) => d.id).distance(120).strength(0.4))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(30));

    // Links
    const link = g.append("g").selectAll("line").data(links).join("line")
      .attr("stroke", (d) => LINK_COLORS[d.type] || "#6b7280")
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", (d) => Math.max(1, (d.weight || 0.5) * 3));

    // Nodes
    const node = g.append("g").selectAll("g").data(nodes).join("g")
      .call(d3.drag()
        .on("start", (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag",  (e, d) => { d.fx = e.x; d.fy = e.y; })
        .on("end",   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    // Node circle + favicon or letter
    node.append("circle").attr("r", 20)
      .attr("fill", "#1f2937").attr("stroke", "#374151").attr("stroke-width", 1.5);

    node.append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
      .attr("font-size", "9px").attr("fill", "#e5e7eb")
      .text((d) => (d.title || "").slice(0, 14) + ((d.title || "").length > 14 ? "…" : ""));

    // Tooltip title on hover
    node.append("title").text((d) => d.title || d.url || d.id);

    sim.on("tick", () => {
      link.attr("x1", (d) => d.source.x).attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x).attr("y2", (d) => d.target.y);
      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    return () => sim.stop();
  }, [data]);

  if (isLoading) return (
    <div className="flex-1 flex items-center justify-center h-full">
      <Spinner size="lg" />
    </div>
  );

  if (!data?.nodes?.length) return (
    <EmptyState icon={RiShareLine} title="No graph data yet"
      description="Save a few links and let Raven build your knowledge graph." />
  );

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-foreground">Knowledge Graph</h1>
          <p className="text-xs text-muted-foreground">
            {data.stats?.totalNodes} nodes · {data.stats?.totalLinks} connections
          </p>
        </div>
        <div className="flex gap-3 text-[10px] text-muted-foreground">
          {Object.entries(LINK_COLORS).map(([type, color]) => (
            <span key={type} className="flex items-center gap-1">
              <span className="w-3 h-0.5 inline-block rounded" style={{ background: color }} />
              {type.replace("-", " ")}
            </span>
          ))}
        </div>
      </div>
      <div ref={svgRef} className="flex-1 rounded-xl border border-border bg-card min-h-[500px]" />
    </div>
  );
}

