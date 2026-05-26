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
type TimelineForce = ((alpha: number) => void) & {
  initialize?: (nodes: GraphNodeObject[]) => void;
};
type TimelinePosition = {
  graphY: number;
};
type TimelineTick = {
  label: string;
  graphY: number;
};
type TimelineLayout = {
  axisBottomGraphY: number;
  axisTopGraphY: number;
  railLeft: number;
  targetGraphX: number;
  nodePositions: Map<string, TimelinePosition>;
  ticks: TimelineTick[];
};
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

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_TIMELINE_TICKS = 7;
const RELEASE_DATE_FORMATTER = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
  year: "numeric",
});

function parseReleaseTime(node: LanguageGraphNode) {
  const releaseDate = node.releaseDate;

  if (releaseDate) {
    const parsed = Date.parse(`${releaseDate}T00:00:00Z`);

    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return Date.UTC(node.year, 0, 1);
}

function formatReleaseDate(node: LanguageGraphNode) {
  const releaseDate = node.releaseDate;

  if (!releaseDate) {
    return String(node.year);
  }

  const parsed = Date.parse(`${releaseDate}T00:00:00Z`);

  if (!Number.isFinite(parsed)) {
    return releaseDate;
  }

  return RELEASE_DATE_FORMATTER.format(new Date(parsed));
}

function buildTimelineYears(minYear: number, maxYear: number) {
  if (minYear === maxYear) {
    return [minYear];
  }

  const span = maxYear - minYear;
  const step = span <= 8 ? 1 : span > 80 ? 20 : 10;
  const years = new Set([minYear, maxYear]);

  for (let year = Math.ceil(minYear / step) * step; year <= maxYear; year += step) {
    years.add(year);
  }

  const sortedYears = Array.from(years).sort((a, b) => a - b);

  if (sortedYears.length <= MAX_TIMELINE_TICKS) {
    return sortedYears;
  }

  const first = sortedYears[0];
  const last = sortedYears[sortedYears.length - 1];
  const interior = sortedYears.slice(1, -1);
  const keepEvery = Math.ceil(interior.length / (MAX_TIMELINE_TICKS - 2));

  return [
    first,
    ...interior
      .filter((_, index) => index % keepEvery === 0)
      .slice(0, MAX_TIMELINE_TICKS - 2),
    last,
  ];
}

function centeredLaneOffset(value: string, laneCount: number, laneWidth: number) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return (hash % laneCount - (laneCount - 1) / 2) * laneWidth;
}

function buildTimelineLayout(
  nodes: LanguageGraphNode[],
  size: { width: number; height: number },
): TimelineLayout {
  const topPadding = size.height < 460 ? 28 : 42;
  const bottomPadding = size.height < 460 ? 42 : 64;
  const axisTop = topPadding;
  const axisBottom = Math.max(axisTop + 180, size.height - bottomPadding);
  const axisTopGraphY = axisTop - size.height / 2;
  const axisBottomGraphY = axisBottom - size.height / 2;
  const railLeft = size.width < 640 ? 34 : 54;
  const targetScreenX = Math.max(railLeft + 178, size.width * 0.54);
  const targetGraphX = targetScreenX - size.width / 2;

  if (nodes.length === 0) {
    return {
      axisBottomGraphY,
      axisTopGraphY,
      nodePositions: new Map(),
      railLeft,
      targetGraphX,
      ticks: [],
    };
  }

  const datedNodes = nodes
    .map((node) => ({
      node,
      time: parseReleaseTime(node),
    }))
    .sort((a, b) => a.time - b.time || a.node.name.localeCompare(b.node.name));

  const minTime = datedNodes[0].time;
  const maxTime = datedNodes[datedNodes.length - 1].time;
  const timeSpan = Math.max(DAY_MS, maxTime - minTime);
  const axisHeight = axisBottom - axisTop;
  const timeToScreenY = (time: number) =>
    nodes.length === 1
      ? axisTop + axisHeight / 2
      : axisTop + ((time - minTime) / timeSpan) * axisHeight;
  const timeToGraphY = (time: number) => timeToScreenY(time) - size.height / 2;

  const nodePositions = new Map<string, TimelinePosition>();
  datedNodes.forEach(({ node, time }) => {
    nodePositions.set(node.id, {
      graphY: timeToGraphY(time),
    });
  });

  const minYear = new Date(minTime).getUTCFullYear();
  const maxYear = new Date(maxTime).getUTCFullYear();
  const ticks = buildTimelineYears(minYear, maxYear).map((year) => {
    const tickTime =
      year === minYear ? minTime : year === maxYear ? maxTime : Date.UTC(year, 0, 1);

    return {
      label: String(year),
      graphY: timeToGraphY(tickTime),
    };
  });

  return {
    axisBottomGraphY,
    axisTopGraphY,
    nodePositions,
    railLeft,
    targetGraphX,
    ticks,
  };
}

function drawTimelineRail(
  ctx: CanvasRenderingContext2D,
  globalScale: number,
  layout: TimelineLayout,
  railX: number,
) {
  if (layout.ticks.length === 0) {
    return;
  }

  const scale = globalScale || 1;
  const tickLength = 12 / scale;
  const labelGap = 8 / scale;
  const fontSize = 11 / scale;

  ctx.save();
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(8,145,178,0.16)";
  ctx.shadowBlur = 18 / scale;
  ctx.strokeStyle = "rgba(51,65,85,0.25)";
  ctx.lineWidth = 1 / scale;
  ctx.beginPath();
  ctx.moveTo(railX, layout.axisTopGraphY);
  ctx.lineTo(railX, layout.axisBottomGraphY);
  ctx.stroke();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(100,116,139,0.82)";
  ctx.font = `700 ${fontSize}px Inter, Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  layout.ticks.forEach((tick) => {
    ctx.strokeStyle = "rgba(51,65,85,0.24)";
    ctx.lineWidth = 1 / scale;
    ctx.beginPath();
    ctx.moveTo(railX - tickLength, tick.graphY);
    ctx.lineTo(railX, tick.graphY);
    ctx.stroke();
    ctx.fillText(tick.label, railX - tickLength - labelGap, tick.graphY);
  });

  ctx.restore();
}

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
  ctx.fillStyle = isActive ? "rgba(15,23,42,0.9)" : "rgba(51,65,85,0.8)";
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
      graphRef.current?.centerAt(0, 0, 320);
      graphRef.current?.zoom(1, 320);
      graphRef.current?.d3ReheatSimulation();
    }, 120);

    return () => window.clearTimeout(timeout);
  }, [filteredGraph.nodes.length, size.height, size.width]);

  const timelineLayout = useMemo(
    () => buildTimelineLayout(filteredGraph.nodes, size),
    [filteredGraph.nodes, size],
  );

  const timelineGraph = useMemo(() => {
    const laneCount = size.width < 640 ? 3 : 5;
    const laneWidth = size.width < 640 ? 44 : 62;

    return {
      nodes: filteredGraph.nodes.map((node) => {
        const position = timelineLayout.nodePositions.get(node.id);
        const timelineX =
          timelineLayout.targetGraphX +
          centeredLaneOffset(node.id, laneCount, laneWidth);

        return {
          ...node,
          fy: position?.graphY,
          timelineX,
          x: timelineX,
          y: position?.graphY,
        };
      }),
      links: filteredGraph.links.map((link) => ({
        source: endpointId(link.source),
        target: endpointId(link.target),
        type: link.type,
      })),
    };
  }, [filteredGraph.links, filteredGraph.nodes, size.width, timelineLayout]);

  useEffect(() => {
    const graph = graphRef.current;

    if (!graph) {
      return;
    }

    let forceNodes: GraphNodeObject[] = [];
    const timelineXForce: TimelineForce = (alpha) => {
      forceNodes.forEach((node) => {
        if (typeof node.timelineX !== "number") {
          return;
        }

        const currentX = node.x ?? node.timelineX;
        node.vx = (node.vx ?? 0) + (node.timelineX - currentX) * 0.08 * alpha;
      });
    };

    timelineXForce.initialize = (nodes) => {
      forceNodes = nodes;
    };

    graph.d3Force("timelineX", timelineXForce);
    graph.d3ReheatSimulation();

    return () => {
      graph.d3Force("timelineX", null);
    };
  }, [timelineGraph]);

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
        graphData={timelineGraph as GraphData<LanguageGraphNode, LanguageGraphLink>}
        width={size.width}
        height={size.height}
        backgroundColor="rgba(0,0,0,0)"
        nodeRelSize={6}
        nodeLabel={(node) => `${node.name} (${formatReleaseDate(node)})`}
        onRenderFramePre={(ctx, globalScale) => {
          const railX =
            graphRef.current?.screen2GraphCoords(timelineLayout.railLeft, 0).x ??
            timelineLayout.railLeft - size.width / 2;

          drawTimelineRail(
            ctx,
            globalScale,
            timelineLayout,
            railX,
          );
        }}
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
          const sourceNode = timelineGraph.nodes.find((node) => node.id === sourceId);
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
        cooldownTicks={120}
        d3VelocityDecay={0.38}
        enableNodeDrag={false}
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
