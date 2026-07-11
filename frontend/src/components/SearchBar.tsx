"use client";

import { useMemo } from "react";
import { useGraph } from "@/context/GraphContext";
import { PARADIGM_OPTIONS } from "@/lib/palette";

const ERA_OPTIONS = ["1950s", "1960s", "1970s", "1980s", "1990s", "2000s"];

export function SearchBar() {
  const { filters, paradigms, setEra, setParadigm, setQuery } = useGraph();

  const groupedOptions = useMemo(() => {
    const allOptions = Array.from(new Set([...PARADIGM_OPTIONS, ...paradigms]));

    const groups: Record<string, string[]> = {
      "Language Paradigms": [],
      "Frameworks": [],
      "Libraries": [],
      "Other Categories": [],
    };

    const categoryMapping: Record<string, string> = {
      "Object-Oriented": "Language Paradigms",
      "Functional": "Language Paradigms",
      "Procedural": "Language Paradigms",
      "Imperative": "Language Paradigms",
      "Multi-Paradigm": "Language Paradigms",
      "Systems": "Language Paradigms",
      "Scripting": "Language Paradigms",
      "Logic": "Language Paradigms",
      "Concurrent": "Language Paradigms",
      "Generic": "Language Paradigms",
      "Component-Based": "Frameworks",
      "Frameworks -> Component-Based": "Frameworks",
      "MVC": "Frameworks",
      "MVC (Model-View-Controller)": "Frameworks",
      "Frameworks -> MVC": "Frameworks",
      "Micro-Framework": "Frameworks",
      "Frameworks -> Micro-Framework": "Frameworks",
      "State Management": "Libraries",
      "Libraries -> State Management": "Libraries",
      "Utility": "Libraries",
      "Libraries -> Utility": "Libraries",
      "Testing": "Libraries",
      "Libraries -> Testing": "Libraries",
    };

    allOptions.forEach((opt) => {
      const groupName = categoryMapping[opt] || "Other Categories";
      groups[groupName].push(opt);
    });

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => a.localeCompare(b));
    });

    return groups;
  }, [paradigms]);

  return (
    <section className="pointer-events-none fixed left-0 right-0 top-24 z-20 px-4 sm:px-6 lg:px-8">
      <div className="pointer-events-auto mx-auto grid max-w-4xl gap-3 rounded-[2rem] border border-black/10 bg-transparent p-2 shadow-2xl shadow-black/5 md:grid-cols-[minmax(0,1fr)_13rem_9rem]">
        <label className="sr-only" htmlFor="language-search">
          Search languages
        </label>
        <input
          id="language-search"
          type="search"
          value={filters.query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search languages"
          className="h-12 min-w-0 rounded-full border border-black/10 bg-transparent px-5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.3] focus:ring-2 focus:ring-cyan-600/20"
        />

        <label className="sr-only" htmlFor="paradigm-filter">
          Filter by paradigm
        </label>
        <select
          id="paradigm-filter"
          value={filters.paradigm}
          onChange={(event) => setParadigm(event.target.value)}
          className="h-12 min-w-0 rounded-full border border-black/10 bg-transparent px-4 text-sm text-slate-800 outline-none transition focus:border-violet-600/60 focus:ring-2 focus:ring-violet-600/20 cursor-pointer"
        >
          <option value="">All paradigms & categories</option>
          {Object.entries(groupedOptions).map(([groupName, items]) => {
            if (items.length === 0) return null;
            return (
              <optgroup key={groupName} label={groupName}>
                {items.map((item) => (
                  <option key={item} value={item}>
                    {item.replace(/^(Frameworks|Libraries)\s*->\s*/i, "")}
                  </option>
                ))}
              </optgroup>
            );
          })}
        </select>

        <label className="sr-only" htmlFor="era-filter">
          Filter by era
        </label>
        <select
          id="era-filter"
          value={filters.era}
          onChange={(event) => setEra(event.target.value)}
          className="h-12 min-w-0 rounded-full border border-black/10 bg-transparent px-4 text-sm text-slate-800 outline-none transition focus:border-amber-600/60 focus:ring-2 focus:ring-amber-600/20"
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
