// src/features/graph/pages/GraphPage.jsx
//
// FIX: The original had two bugs:
//   1. el.clientWidth was read synchronously before the browser had laid out
//      the flex container → always 0, so D3 got a 0×0 canvas.
//   2. No way to open a save from the graph.
//   3. D3 tick handler wasn't clamped so nodes flew off-screen.
//
// Fixes applied:
//   • Use ResizeObserver to start the simulation only when the container has
//     real pixel dimensions.
//   • Clamp node positions to stay inside the viewBox on every tick.
//   • Add a click handler on nodes that opens the SaveDetailPanel.
//   • Add a legend overlay inside the SVG (no layout jank).

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { useGraph } from "../hooks/useGraph";
import { Spinner } from "../../../components/ui/Spinner";
import { EmptyState } from "../../../components/ui/EmptyState";
import SaveDetailPanel from "../../saves/components/SaveDetailPanel";
import { useSaveById } from "../../saves/hooks/useSaves";
import { RiShareLine } from "react-icons/ri";

const LINK_COLORS = {
  "shared-tag": "#a78bfa",
  "same-cluster": "#38bdf8",
  embedding: "#4ade80",
};

const NODE_RADIUS = 22;

// Small shim so we can open the detail panel without a full save object
function PanelShim({ nodeId, onClose }) {
  const { data: save } = useSaveById(nodeId);
  if (!save) return null;
  return <SaveDetailPanel save={save} onClose={onClose} />;
}

export default function GraphPage() {
  const { data, isLoading } = useGraph();
  const containerRef = useRef(null);
  const simRef = useRef(null);
  const [selectedId, setSelectedId] = useState(null);

  // ── Render graph whenever data or container size changes ──────────────────
  const renderGraph = useCallback(
    (W, H) => {
      if (!data?.nodes?.length || !containerRef.current) return;

      const el = containerRef.current;

      // Clear previous render and stop old simulation
      if (simRef.current) simRef.current.stop();
      d3.select(el).selectAll("*").remove();

      const nodes = data.nodes.map((n) => ({ ...n }));
      const links = data.links.map((l) => ({ ...l }));

      const svg = d3
        .select(el)
        .append("svg")
        .attr("width", W)
        .attr("height", H)
        .style("cursor", "grab");

      // Zoom container
      const g = svg.append("g");

      svg.call(
        d3
          .zoom()
          .scaleExtent([0.1, 5])
          .on("zoom", (e) => {
            svg.style("cursor", "grabbing");
            g.attr("transform", e.transform);
          })
          .on("end", () => svg.style("cursor", "grab"))
      );

      // Links
      const link = g
        .append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke", (d) => LINK_COLORS[d.type] || "#6b7280")
        .attr("stroke-opacity", 0.45)
        .attr("stroke-width", (d) => Math.max(1, (d.weight || 0.5) * 2.5));

      // Node groups
      const node = g
        .append("g")
        .attr("class", "nodes")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("class", "node-group")
        .style("cursor", "pointer")
        .call(
          d3
            .drag()
            .on("start", (e, d) => {
              if (!e.active) sim.alphaTarget(0.3).restart();
              d.fx = d.x;
              d.fy = d.y;
            })
            .on("drag", (e, d) => {
              d.fx = e.x;
              d.fy = e.y;
            })
            .on("end", (e, d) => {
              if (!e.active) sim.alphaTarget(0);
              d.fx = null;
              d.fy = null;
            })
        )
        .on("click", (e, d) => {
          e.stopPropagation();
          setSelectedId(d.id);
        });

      // Node circles
      node
        .append("circle")
        .attr("r", NODE_RADIUS)
        .attr("fill", (d) => {
          if (d.clusterLabel) {
            // Color by cluster index (deterministic hash)
            const CLUSTER_COLORS = ["#7c3aed", "#0891b2", "#16a34a", "#d97706", "#dc2626", "#db2777"];
            let hash = 0;
            for (const c of d.clusterId || d.id) hash = (hash << 5) - hash + c.charCodeAt(0);
            return CLUSTER_COLORS[Math.abs(hash) % CLUSTER_COLORS.length] + "33";
          }
          return "#1f2937";
        })
        .attr("stroke", (d) => (d.clusterLabel ? "#ffffff22" : "#374151"))
        .attr("stroke-width", 1.5);

      // Favicon inside circle (if available)
      node
        .filter((d) => !!d.favicon)
        .append("image")
        .attr("href", (d) => d.favicon)
        .attr("x", -8)
        .attr("y", -8)
        .attr("width", 16)
        .attr("height", 16)
        .attr("clip-path", "circle(8px)");

      // Title label (below circle)
      node
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", NODE_RADIUS + 13)
        .attr("font-size", "9px")
        .attr("fill", "#9ca3af")
        .text((d) => {
          const t = d.title || d.url || "";
          return t.length > 18 ? t.slice(0, 18) + "…" : t;
        });

      // Type badge
      node
        .append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("font-size", "8px")
        .attr("fill", "#6b7280")
        .text((d) => (d.type || "").toUpperCase().slice(0, 3));

      node.append("title").text((d) => d.title || d.url || d.id);

      // Simulation
      const sim = d3
        .forceSimulation(nodes)
        .force(
          "link",
          d3
            .forceLink(links)
            .id((d) => d.id)
            .distance(100)
            .strength(0.35)
        )
        .force("charge", d3.forceManyBody().strength(-260))
        .force("center", d3.forceCenter(W / 2, H / 2))
        .force("collision", d3.forceCollide(NODE_RADIUS + 8));

      simRef.current = sim;

      sim.on("tick", () => {
        // Clamp nodes to stay inside viewport
        nodes.forEach((d) => {
          d.x = Math.max(NODE_RADIUS, Math.min(W - NODE_RADIUS, d.x));
          d.y = Math.max(NODE_RADIUS, Math.min(H - NODE_RADIUS, d.y));
        });

        link
          .attr("x1", (d) => d.source.x)
          .attr("y1", (d) => d.source.y)
          .attr("x2", (d) => d.target.x)
          .attr("y2", (d) => d.target.y);

        node.attr("transform", (d) => `translate(${d.x},${d.y})`);
      });
    },
    [data]
  );

  // ── Use ResizeObserver so we always get real pixel dimensions ─────────────
  useEffect(() => {
    if (!data?.nodes?.length || !containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          renderGraph(width, height);
        }
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      if (simRef.current) simRef.current.stop();
    };
  }, [data, renderGraph]);

  if (isLoading)
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Spinner size="lg" />
      </div>
    );

  if (!data?.nodes?.length)
    return (
      <EmptyState
        icon={RiShareLine}
        title="No graph data yet"
        description="Save a few links and let Raven build your knowledge graph. Make sure to run clustering first."
      />
    );

  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              Knowledge Graph
            </h1>
            <p className="text-xs text-muted-foreground">
              {data.stats?.totalNodes} nodes · {data.stats?.totalLinks}{" "}
              connections · click any node to inspect
            </p>
          </div>
          <div className="flex gap-3 text-[10px] text-muted-foreground">
            {Object.entries(LINK_COLORS).map(([type, color]) => (
              <span key={type} className="flex items-center gap-1">
                <span
                  className="w-3 h-0.5 inline-block rounded"
                  style={{ background: color }}
                />
                {type.replace("-", " ")}
              </span>
            ))}
          </div>
        </div>

        {/* Graph canvas */}
        <div
          ref={containerRef}
          className="flex-1 rounded-xl border border-border bg-card min-h-[500px] overflow-hidden"
        />
      </div>

      {/* Detail panel */}
      {selectedId && (
        <PanelShim nodeId={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}