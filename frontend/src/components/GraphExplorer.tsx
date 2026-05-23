"use client";

import { ForceGraph } from "@/components/ForceGraph";
import { Header } from "@/components/Header";
import { LanguageModal } from "@/components/LanguageModal";
import { SearchBar } from "@/components/SearchBar";
import { GraphProvider, useGraph } from "@/context/GraphContext";

function GraphStatusOverlay() {
  const { error, reloadGraph, status } = useGraph();

  if (status === "ready") {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center px-4">
      <div className="glass-panel pointer-events-auto max-w-md px-5 py-4 text-center">
        {status === "error" ? (
          <>
            <p className="text-base font-semibold text-white">
              Could not reach the Spring Boot API.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Start the backend on port 8081, then retry the graph request.
            </p>
            {error ? (
              <p className="mt-3 rounded-xl border border-red-300/20 bg-red-500/10 px-3 py-2 text-xs text-red-100">
                {error}
              </p>
            ) : null}
            <button
              type="button"
              className="liquid-button mt-4"
              onClick={() => void reloadGraph()}
            >
              Retry
            </button>
          </>
        ) : (
          <p className="text-sm font-medium text-slate-100">Loading graph...</p>
        )}
      </div>
    </div>
  );
}

function ExplorerCanvas() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-app text-white">
      <div className="graph-grid" aria-hidden="true" />
      <Header />
      <SearchBar />
      <ForceGraph />
      <GraphStatusOverlay />
      <LanguageModal />
    </main>
  );
}

export function GraphExplorer() {
  return (
    <GraphProvider>
      <ExplorerCanvas />
    </GraphProvider>
  );
}
