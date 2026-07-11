"use client";

import { AddLanguageModal } from "@/components/AddLanguageModal";
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
            <p className="text-base font-semibold text-slate-800">
              Could not load the language graph.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Check the configured API URL, then retry the graph request.
            </p>
            {error ? (
              <p className="mt-3 rounded-xl border border-red-300/30 bg-transparent px-3 py-2 text-xs text-red-700">
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
          <p className="text-sm font-medium text-slate-700">Loading graph...</p>
        )}
      </div>
    </div>
  );
}

function ExplorerCanvas() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-app text-slate-800">
      <Header />
      <SearchBar />
      <ForceGraph />
      <GraphStatusOverlay />
      <LanguageModal />
      <AddLanguageModal />
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
