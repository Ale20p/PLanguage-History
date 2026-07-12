"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createLanguage, getGraph, getLanguageDetail, searchLanguages, updateLanguage } from "@/lib/api";
import type {
  GraphFilters,
  GraphResponse,
  LanguageDetail,
  LanguageGraphLink,
  LanguageGraphNode,
  LoadState,
} from "@/types";

interface GraphContextValue {
  graph: GraphResponse;
  filteredGraph: GraphResponse;
  filters: GraphFilters;
  status: LoadState;
  detailStatus: LoadState;
  error: string | null;
  selectedLanguage: LanguageDetail | null;
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  resultCount: number;
  paradigms: string[];
  setQuery: (query: string) => void;
  setParadigm: (paradigm: string) => void;
  setEra: (era: string) => void;
  setHoveredNodeId: (id: string | null) => void;
  selectLanguage: (id: string) => Promise<void>;
  closeLanguage: () => void;
  resetFilters: () => void;
  reloadGraph: () => Promise<void>;
  updateLanguage: (id: string, data: Partial<LanguageDetail>) => Promise<void>;
  isAddModalOpen: boolean;
  openAddLanguage: () => void;
  closeAddLanguage: () => void;
  createLanguage: (data: Partial<LanguageDetail>) => Promise<void>;
  traceNodeId: string | null;
  setTraceNodeId: (id: string | null) => void;
}

const EMPTY_GRAPH: GraphResponse = {
  nodes: [],
  links: [],
};

const INITIAL_FILTERS: GraphFilters = {
  query: "",
  paradigm: "",
  era: "",
};

const GraphContext = createContext<GraphContextValue | null>(null);

function getLinkEndpoint(endpoint: string | LanguageGraphNode) {
  return typeof endpoint === "string" ? endpoint : endpoint.id;
}

function applyLocalFilters(nodes: LanguageGraphNode[], filters: GraphFilters) {
  const query = filters.query.trim().toLowerCase();
  const eraStart = filters.era ? Number.parseInt(filters.era, 10) : null;

  return nodes
    .filter((node) => !query || node.name.toLowerCase().includes(query))
    .filter(
      (node) =>
        !filters.paradigm ||
        node.group.toLowerCase() === filters.paradigm.toLowerCase(),
    )
    .filter(
      (node) =>
        eraStart === null || (node.year >= eraStart && node.year < eraStart + 10),
    );
}

function filterLinks(links: LanguageGraphLink[], visibleNodeIds: Set<string>) {
  return links.filter(
    (link) =>
      visibleNodeIds.has(getLinkEndpoint(link.source)) &&
      visibleNodeIds.has(getLinkEndpoint(link.target)),
  );
}

export function GraphProvider({ children }: { children: React.ReactNode }) {
  const [graph, setGraph] = useState<GraphResponse>(EMPTY_GRAPH);
  const [filters, setFilters] = useState<GraphFilters>(INITIAL_FILTERS);
  const [visibleNodeIds, setVisibleNodeIds] = useState<Set<string> | null>(null);
  const [status, setStatus] = useState<LoadState>("loading");
  const [detailStatus, setDetailStatus] = useState<LoadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageDetail | null>(
    null,
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, LanguageDetail>>(
    {},
  );
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [traceNodeId, setTraceNodeId] = useState<string | null>(null);

  const reloadGraph = useCallback(async () => {
    setStatus("loading");
    setError(null);

    try {
      const nextGraph = await getGraph();
      setGraph(nextGraph);
      setVisibleNodeIds(new Set(nextGraph.nodes.map((node) => node.id)));
      setStatus("ready");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to load graph data.",
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;

    void (async () => {
      try {
        const nextGraph = await getGraph();

        if (!isCurrent) {
          return;
        }

        setGraph(nextGraph);
        setVisibleNodeIds(new Set(nextGraph.nodes.map((node) => node.id)));
        setStatus("ready");
      } catch (requestError) {
        if (!isCurrent) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load graph data.",
        );
        setStatus("error");
      }
    })();

    return () => {
      isCurrent = false;
    };
  }, []);

  useEffect(() => {
    if (status !== "ready") {
      return;
    }

    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const results = await searchLanguages(filters);
          setVisibleNodeIds(new Set(results.map((result) => result.id)));
        } catch {
          const localResults = applyLocalFilters(graph.nodes, filters);
          setVisibleNodeIds(new Set(localResults.map((node) => node.id)));
        }
      })();
    }, 180);

    return () => window.clearTimeout(timeout);
  }, [filters, graph.nodes, status]);

  const connectedNodeIds = useMemo(() => {
    if (!traceNodeId) {
      return null;
    }

    const visited = new Set<string>();
    const queue: string[] = [traceNodeId];
    visited.add(traceNodeId);

    const adj = new Map<string, string[]>();
    graph.links.forEach((link) => {
      const u = getLinkEndpoint(link.source);
      const v = getLinkEndpoint(link.target);
      if (!adj.has(u)) adj.set(u, []);
      if (!adj.has(v)) adj.set(v, []);
      adj.get(u)!.push(v);
      adj.get(v)!.push(u);
    });

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const neighbors = adj.get(curr) || [];
      neighbors.forEach((neigh) => {
        if (!visited.has(neigh)) {
          visited.add(neigh);
          queue.push(neigh);
        }
      });
    }

    return visited;
  }, [graph.links, traceNodeId]);

  const filteredGraph = useMemo(() => {
    const ids = connectedNodeIds ?? (visibleNodeIds ?? new Set(graph.nodes.map((node) => node.id)));
    const nodes = graph.nodes.filter((node) => ids.has(node.id));

    return {
      nodes,
      links: filterLinks(graph.links, ids),
    };
  }, [graph.links, graph.nodes, visibleNodeIds, connectedNodeIds]);

  const paradigms = useMemo(
    () =>
      Array.from(new Set(graph.nodes.map((node) => node.group).filter(Boolean))).sort(
        (a, b) => a.localeCompare(b),
      ),
    [graph.nodes],
  );

  const selectLanguage = useCallback(
    async (id: string) => {
      setSelectedNodeId(id);
      setDetailStatus("loading");

      const cached = detailCache[id];
      if (cached) {
        setSelectedLanguage(cached);
        setDetailStatus("ready");
        return;
      }

      try {
        const detail = await getLanguageDetail(id);
        setDetailCache((current) => ({ ...current, [id]: detail }));
        setSelectedLanguage(detail);
        setDetailStatus("ready");
      } catch {
        setDetailStatus("error");
      }
    },
    [detailCache],
  );

  const closeLanguage = useCallback(() => {
    setSelectedLanguage(null);
    setSelectedNodeId(null);
    setDetailStatus("idle");
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setTraceNodeId(null);
    setVisibleNodeIds(new Set(graph.nodes.map((node) => node.id)));
  }, [graph.nodes]);

  const updateLanguageData = useCallback(
    async (id: string, data: Partial<LanguageDetail>) => {
      const updated = await updateLanguage(id, data);
      setDetailCache((current) => ({ ...current, [id]: updated }));
      setSelectedLanguage(updated);
      await reloadGraph();
    },
    [reloadGraph],
  );

  const openAddLanguage = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);

  const closeAddLanguage = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);

  const createLanguageData = useCallback(
    async (data: Partial<LanguageDetail>) => {
      await createLanguage(data);
      await reloadGraph();
      setIsAddModalOpen(false);
    },
    [reloadGraph],
  );

  const value = useMemo<GraphContextValue>(
    () => ({
      graph,
      filteredGraph,
      filters,
      status,
      detailStatus,
      error,
      selectedLanguage,
      selectedNodeId,
      hoveredNodeId,
      resultCount: filteredGraph.nodes.length,
      paradigms,
      setQuery: (query) =>
        setFilters((current) => ({
          ...current,
          query,
        })),
      setParadigm: (paradigm) =>
        setFilters((current) => ({
          ...current,
          paradigm,
        })),
      setEra: (era) =>
        setFilters((current) => ({
          ...current,
          era,
        })),
      setHoveredNodeId,
      selectLanguage,
      closeLanguage,
      resetFilters,
      reloadGraph,
      updateLanguage: updateLanguageData,
      isAddModalOpen,
      openAddLanguage,
      closeAddLanguage,
      createLanguage: createLanguageData,
      traceNodeId,
      setTraceNodeId,
    }),
    [
      graph,
      filteredGraph,
      filters,
      status,
      detailStatus,
      error,
      selectedLanguage,
      selectedNodeId,
      hoveredNodeId,
      paradigms,
      selectLanguage,
      closeLanguage,
      resetFilters,
      reloadGraph,
      updateLanguageData,
      isAddModalOpen,
      openAddLanguage,
      closeAddLanguage,
      createLanguageData,
      traceNodeId,
    ],
  );

  return <GraphContext.Provider value={value}>{children}</GraphContext.Provider>;
}

export function useGraph() {
  const context = useContext(GraphContext);

  if (!context) {
    throw new Error("useGraph must be used within GraphProvider.");
  }

  return context;
}
