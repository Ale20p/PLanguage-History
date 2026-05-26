"use client";

import { useGraph } from "@/context/GraphContext";

export function Header() {
  const { graph, resultCount, status, resetFilters } = useGraph();

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
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-800">
              {status === "ready" ? resultCount : 0} / {graph.nodes.length}
            </p>
            <p className="text-xs text-slate-400">visible languages</p>
          </div>
          <button
            type="button"
            className="liquid-button"
            onClick={resetFilters}
            title="Reset filters"
          >
            Reset
          </button>
        </div>
      </div>
    </header>
  );
}
