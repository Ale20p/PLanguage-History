"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ForceGraphMethods,
  ForceGraphProps,
  GraphData,
  LinkObject,
  NodeObject,
} from "react-force-graph-2d";
import { useGraph } from "@/context/GraphContext";
import { getParadigmColor, readableConnectionType } from "@/lib/palette";
import type { LanguageGraphLink, LanguageGraphNode } from "@/types";

type GraphNodeObject = NodeObject<LanguageGraphNode>;
type GraphLinkObject = LinkObject<LanguageGraphNode, LanguageGraphLink>;
type ForceGraphComponent = React.ComponentType<
  ForceGraphProps<LanguageGraphNode, LanguageGraphLink> & {
    ref?: React.MutableRefObject<
      ForceGraphMethods<LanguageGraphNode, LanguageGraphLink> | undefined
    >;
  }
>;

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
}) as ForceGraphComponent;

function endpointId(endpoint: GraphLinkObject["source"]) {
  if (endpoint === undefined || endpoint === null) {
    return "";
  }

  return typeof endpoint === "object" ? String(endpoint.id) : String(endpoint);
}

function drawNode(
  node: GraphNodeObject,
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  isActive: boolean,
) {
  const x = node.x ?? 0;
  const y = node.y ?? 0;
  const color = getParadigmColor(node.group);
  const radius = isActive ? 8 : 6;
  const label = node.name;
  const fontSize = Math.max(3.2, 13 / globalScale);
  const labelOffset = radius + 4 / globalScale;

  ctx.save();

  // Soft colored glow behind the node
  ctx.shadowColor = color;
  ctx.shadowBlur = isActive ? 18 : 8;

  // Thin colored border — the crystal outline
  ctx.lineWidth = isActive ? 1.2 : 0.8;
  ctx.strokeStyle = isActive ? color : `${color}aa`;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
  ctx.stroke();

  // Clear shadow for inner details
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  // Crystal refraction — faint white arc along the top edge
  ctx.lineWidth = 0.6;
  ctx.strokeStyle = isActive
    ? "rgba(255, 255, 255, 0.30)"
    : "rgba(255, 255, 255, 0.15)";
  ctx.beginPath();
  ctx.arc(x, y, radius - 1, -Math.PI * 0.85, -Math.PI * 0.15, false);
  ctx.stroke();

  // Label
  ctx.font = `600 ${fontSize}px Inter, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = isActive ? "rgba(255,255,255,0.96)" : "rgba(226,232,240,0.82)";
  ctx.fillText(label, x, y + labelOffset);
  ctx.restore();
}

function paintPointerArea(
  node: GraphNodeObject,
  color: string,
  ctx: CanvasRenderingContext2D,
) {
  const x = node.x ?? 0;
  const y = node.y ?? 0;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 14, 0, 2 * Math.PI, false);
  ctx.fill();
}

export function ForceGraph() {
  const {
    filteredGraph,
    hoveredNodeId,
    selectedNodeId,
    setHoveredNodeId,
    selectLanguage,
  } = useGraph();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<
    ForceGraphMethods<LanguageGraphNode, LanguageGraphLink> | undefined
  >(undefined);
  const [size, setSize] = useState({ width: 1000, height: 700 });

  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) {
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({
        width: Math.max(320, Math.floor(width)),
        height: Math.max(320, Math.floor(height)),
      });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (filteredGraph.nodes.length === 0) {
      return;
    }

    const timeout = window.setTimeout(() => {
      graphRef.current?.zoomToFit(520, 120);

      window.setTimeout(() => {
        const zoom = graphRef.current?.zoom();
        if (zoom && zoom > 2.2) {
          graphRef.current?.zoom(2.2, 220);
        }
      }, 560);
    }, 160);

    return () => window.clearTimeout(timeout);
  }, [filteredGraph]);

  const activeNodeIds = useMemo(() => {
    const active = new Set<string>();

    if (hoveredNodeId) {
      active.add(hoveredNodeId);
    }

    if (selectedNodeId) {
      active.add(selectedNodeId);
    }

    return active;
  }, [hoveredNodeId, selectedNodeId]);

  return (
    <div ref={wrapperRef} className="absolute inset-x-0 bottom-0 top-44 sm:top-40">
      <ForceGraph2D
        ref={graphRef}
        graphData={filteredGraph as GraphData<LanguageGraphNode, LanguageGraphLink>}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(0,0,0,0)"
        nodeRelSize={6}
        nodeLabel={(node) => `${node.name} (${node.year})`}
        nodeCanvasObject={(node, ctx, globalScale) =>
          drawNode(
            node,
            ctx,
            globalScale,
            activeNodeIds.has(String(node.id)),
          )
        }
        nodePointerAreaPaint={paintPointerArea}
        linkLabel={(link) => readableConnectionType(link.type ?? "connection")}
        linkColor={(link) => {
          const sourceId = endpointId(link.source);
          const sourceNode = filteredGraph.nodes.find((node) => node.id === sourceId);
          return `${getParadigmColor(sourceNode?.group)}88`;
        }}
        linkWidth={(link) => {
          const source = endpointId(link.source);
          const target = endpointId(link.target);
          return activeNodeIds.has(source) || activeNodeIds.has(target) ? 2.2 : 1.15;
        }}
        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={0.92}
        linkDirectionalParticles={(link) => {
          const source = endpointId(link.source);
          const target = endpointId(link.target);
          return activeNodeIds.has(source) || activeNodeIds.has(target) ? 2 : 0;
        }}
        linkDirectionalParticleSpeed={0.006}
        linkDirectionalParticleWidth={2.2}
        cooldownTicks={80}
        d3VelocityDecay={0.34}
        onNodeHover={(node) => setHoveredNodeId(node?.id ? String(node.id) : null)}
        onNodeClick={(node) => {
          if (node.id) {
            void selectLanguage(String(node.id));
          }
        }}
        onBackgroundClick={() => setHoveredNodeId(null)}
        showPointerCursor
      />
    </div>
  );
}
