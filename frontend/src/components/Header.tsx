"use client";

import { useGraph } from "@/context/GraphContext";

export function Header() {
  const { graph, resultCount, status, resetFilters, openAddLanguage, traceNodeId, setTraceNodeId } = useGraph();

  const tracedNode = graph.nodes.find((n) => n.id === traceNodeId);

  return (
    <header className="pointer-events-none fixed left-0 right-0 top-0 z-20 px-4 py-4 sm:px-6 lg:px-8">
      <div className="glass-panel pointer-events-auto mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700/75">
            Programming Language History
          </p>
          <h1 className="truncate text-lg font-semibold text-slate-800 sm:text-2xl">
            Genealogy Explorer
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {traceNodeId && tracedNode && (
            <span className="flex items-center gap-1.5 rounded-full border border-cyan-500/25 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-800 backdrop-blur-md">
              Tracing: {tracedNode.name}
              <button
                onClick={() => setTraceNodeId(null)}
                className="ml-1 hover:text-cyan-950 font-bold transition-colors cursor-pointer"
                title="Clear lineage trace"
              >
                ✕
              </button>
            </span>
          )}
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-800">
              {status === "ready" ? resultCount : 0} / {graph.nodes.length}
            </p>
            <p className="text-xs text-slate-400">
              {traceNodeId ? "isolated lineage" : "visible languages"}
            </p>
          </div>
          <button
            type="button"
            className="liquid-button"
            onClick={resetFilters}
            title="Reset filters"
          >
            Reset
          </button>
          <button
            type="button"
            className="liquid-button border-cyan-600 bg-cyan-600 hover:bg-cyan-700 text-white font-medium shadow-cyan-600/10 shadow-lg"
            onClick={openAddLanguage}
            title="Add new language"
          >
            Add Language
          </button>
        </div>
      </div>
    </header>
  );
}
