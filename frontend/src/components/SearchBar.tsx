"use client";

import { useMemo } from "react";
import { useGraph } from "@/context/GraphContext";
import { PARADIGM_OPTIONS } from "@/lib/palette";

const ERA_OPTIONS = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s"];

export function SearchBar() {
  const { filters, paradigms, setEra, setParadigm, setQuery } = useGraph();

  const paradigmOptions = useMemo(
    () =>
      Array.from(new Set([...PARADIGM_OPTIONS, ...paradigms])).sort((a, b) =>
        a.localeCompare(b),
      ),
    [paradigms],
  );

  return (
    <section className="pointer-events-none fixed left-0 right-0 top-24 z-20 px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-auto mx-auto grid max-w-4xl gap-3 rounded-[2rem] border border-white/10 bg-transparent p-2 shadow-2xl shadow-black/30 md:grid-cols-[minmax(0,1fr)_13rem_9rem]">
        <label className="sr-only" htmlFor="language-search">
          Search languages
        </label>
        <input
          id="language-search"
          type="search"
          value={filters.query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search languages"
          className="h-12 min-w-0 rounded-full border border-white/10 bg-transparent px-5 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:bg-white/[0.04] focus:ring-2 focus:ring-cyan-300/20"
        />

        <label className="sr-only" htmlFor="paradigm-filter">
          Filter by paradigm
        </label>
        <select
          id="paradigm-filter"
          value={filters.paradigm}
          onChange={(event) => setParadigm(event.target.value)}
          className="h-12 min-w-0 rounded-full border border-white/10 bg-transparent px-4 text-sm text-white outline-none transition focus:border-violet-300/60 focus:ring-2 focus:ring-violet-300/20"
        >
          <option value="">All paradigms</option>
          {paradigmOptions.map((paradigm) => (
            <option key={paradigm} value={paradigm}>
              {paradigm}
            </option>
          ))}
        </select>

        <label className="sr-only" htmlFor="era-filter">
          Filter by era
        </label>
        <select
          id="era-filter"
          value={filters.era}
          onChange={(event) => setEra(event.target.value)}
          className="h-12 min-w-0 rounded-full border border-white/10 bg-transparent px-4 text-sm text-white outline-none transition focus:border-amber-300/60 focus:ring-2 focus:ring-amber-300/20"
        >
          <option value="">All eras</option>
          {ERA_OPTIONS.map((era) => (
            <option key={era} value={era}>
              {era}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
