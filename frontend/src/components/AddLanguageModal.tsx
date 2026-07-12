"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { useGraph } from "@/context/GraphContext";

const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 15,
    transition: {
      duration: 0.2,
      ease: "easeInOut",
    },
  },
};

export function AddLanguageModal() {
  const { isAddModalOpen, closeAddLanguage, createLanguage, graph } = useGraph();

  const [name, setName] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [paradigmsText, setParadigmsText] = useState("");
  const [creatorsText, setCreatorsText] = useState("");
  const [influencesText, setInfluencesText] = useState("");
  const [influencedText, setInfluencedText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Helper to slugify names on the client for uniqueness check
  const slugify = (str: string) => {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const isNameTaken = name.trim() !== "" && graph.nodes.some(
    (node) => node.id === slugify(name)
  );

  // Handlers to append selected dropdown values into the textareas/inputs
  const handleAddInfluence = (langName: string) => {
    const currentList = influencesText
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    
    if (!currentList.includes(langName)) {
      currentList.push(langName);
      setInfluencesText(currentList.join(", "));
    }
  };

  const handleAddInfluenced = (langName: string) => {
    const currentList = influencedText
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    
    if (!currentList.includes(langName)) {
      currentList.push(langName);
      setInfluencedText(currentList.join(", "));
    }
  };

  // Clear inputs when modal opens/closes
  useEffect(() => {
    if (isAddModalOpen) {
      setName("");
      setReleaseDate("");
      setWebsite("");
      setDescription("");
      setCodeSnippet("");
      setParadigmsText("");
      setCreatorsText("");
      setInfluencesText("");
      setInfluencedText("");
      setSaveError(null);
    }
  }, [isAddModalOpen]);

  useEffect(() => {
    if (!isAddModalOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        closeAddLanguage();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeAddLanguage, isAddModalOpen, saving]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isNameTaken) {
      setSaveError("Cannot create language: This name is already taken.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    const parsedParadigms = paradigmsText
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const parsedCreators = creatorsText
      .split(",")
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const parsedInfluences = influencesText
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    const parsedInfluenced = influencedText
      .split(",")
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    try {
      await createLanguage({
        name: name.trim(),
        releaseDate,
        website: website.trim(),
        description: description.trim(),
        codeSnippet: codeSnippet.trim(),
        paradigms: parsedParadigms,
        creators: parsedCreators,
        influences: parsedInfluences,
        influenced: parsedInfluenced,
      });
      closeAddLanguage();
    } catch (error) {
      if (error && typeof error === "object" && "error" in error) {
        setSaveError(String((error as { error: string }).error));
      } else {
        setSaveError(
          error instanceof Error ? error.message : "Failed to create language node."
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const nameInputClass = `h-11 rounded-xl border px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:ring-2 disabled:opacity-50 ${
    name.trim() === ""
      ? "border-black/10 bg-white/25 focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-cyan-600/20"
      : isNameTaken
      ? "border-red-500/80 bg-red-50/10 focus:border-red-600 focus:bg-red-50/20 focus:ring-red-600/20"
      : "border-emerald-500/80 bg-emerald-50/10 focus:border-emerald-600 focus:bg-emerald-50/20 focus:ring-emerald-600/20"
  }`;

  const availableLanguages = [...graph.nodes].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AnimatePresence>
      {isAddModalOpen ? (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={saving ? undefined : closeAddLanguage}
        >
          <motion.article
            className="glass-modal grid max-h-[88vh] w-full max-w-5xl overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(event) => event.stopPropagation()}
          >
            <form onSubmit={handleSubmit} className="flex flex-col min-h-0 overflow-y-auto p-6 max-h-[88vh]">
              <div className="mb-6 flex items-center justify-between border-b border-black/10 pb-4">
                <h2 className="text-2xl font-semibold text-slate-800">
                  Add New Language Node
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeAddLanguage}
                    className="liquid-button border-slate-300 hover:border-slate-400 bg-slate-100/60 hover:bg-slate-200/80 !h-9 !py-0 !px-3 !min-h-0 font-medium"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="liquid-button border-cyan-600 bg-cyan-600 hover:bg-cyan-700 text-white font-medium shadow-cyan-600/10 shadow-lg !h-9 !py-0 !px-4 !min-h-0"
                    disabled={saving || isNameTaken}
                  >
                    {saving ? "Creating..." : "Create Node"}
                  </button>
                </div>
              </div>

              {saveError ? (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {saveError}
                </div>
              ) : null}

              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="add-name" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                    Language Name *
                  </label>
                  <input
                    id="add-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={nameInputClass}
                    placeholder="e.g. Rust"
                    disabled={saving}
                  />
                  {name.trim() !== "" && (
                    <span className={`text-[11px] font-medium leading-none ${isNameTaken ? "text-red-600" : "text-emerald-700"}`}>
                      {isNameTaken ? "This language name is already taken." : "Name is available!"}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="add-release-date" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                    Release Date *
                  </label>
                  <input
                    id="add-release-date"
                    type="date"
                    required
                    value={releaseDate}
                    onChange={(e) => setReleaseDate(e.target.value)}
                    className="h-11 rounded-xl border border-black/10 bg-white/25 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20"
                    disabled={saving}
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="add-website" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                    Website URL
                  </label>
                  <input
                    id="add-website"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="h-11 rounded-xl border border-black/10 bg-white/25 px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20"
                    placeholder="e.g. https://www.rust-lang.org"
                    disabled={saving}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="add-paradigms" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                    Paradigms (comma separated)
                  </label>
                  <input
                    id="add-paradigms"
                    type="text"
                    value={paradigmsText}
                    onChange={(e) => setParadigmsText(e.target.value)}
                    className="h-11 rounded-xl border border-black/10 bg-white/25 px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20"
                    placeholder="e.g. Systems, Multi-paradigm, Functional"
                    disabled={saving}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="add-creators" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                    Creators (comma separated)
                  </label>
                  <input
                    id="add-creators"
                    type="text"
                    value={creatorsText}
                    onChange={(e) => setCreatorsText(e.target.value)}
                    className="h-11 rounded-xl border border-black/10 bg-white/25 px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20"
                    placeholder="e.g. Graydon Hoare"
                    disabled={saving}
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="add-influences" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans animate-fade">
                      Influenced By (comma separated)
                    </label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          handleAddInfluence(val);
                          e.target.value = ""; // Reset
                        }
                      }}
                      className="h-8 rounded-lg border border-black/10 bg-white/20 px-2 text-xs text-slate-700 outline-none transition focus:border-cyan-600/60 cursor-pointer"
                      disabled={saving}
                    >
                      <option value="">+ Add from existing...</option>
                      {availableLanguages.map((lang) => (
                        <option key={lang.id} value={lang.name}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    id="add-influences"
                    type="text"
                    value={influencesText}
                    onChange={(e) => setInfluencesText(e.target.value)}
                    className="h-11 rounded-xl border border-black/10 bg-white/25 px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20"
                    placeholder="e.g. C++, Haskell, C"
                    disabled={saving}
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="add-influenced" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                      Influenced (comma separated)
                    </label>
                    <select
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val) {
                          handleAddInfluenced(val);
                          e.target.value = ""; // Reset
                        }
                      }}
                      className="h-8 rounded-lg border border-black/10 bg-white/20 px-2 text-xs text-slate-700 outline-none transition focus:border-cyan-600/60 cursor-pointer"
                      disabled={saving}
                    >
                      <option value="">+ Add from existing...</option>
                      {availableLanguages.map((lang) => (
                        <option key={lang.id} value={lang.name}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    id="add-influenced"
                    type="text"
                    value={influencedText}
                    onChange={(e) => setInfluencedText(e.target.value)}
                    className="h-11 rounded-xl border border-black/10 bg-white/25 px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20"
                    placeholder="e.g. Swift"
                    disabled={saving}
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="add-description" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                    Description *
                  </label>
                  <textarea
                    id="add-description"
                    required
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="rounded-xl border border-black/10 bg-white/25 p-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20 resize-y custom-scrollbar"
                    placeholder="Provide description and features of the language..."
                    disabled={saving}
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label htmlFor="add-code" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                    Code Snippet
                  </label>
                  <textarea
                    id="add-code"
                    rows={6}
                    value={codeSnippet}
                    onChange={(e) => setCodeSnippet(e.target.value)}
                    className="rounded-xl border border-black/10 bg-white/25 p-4 font-mono text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20 resize-y custom-scrollbar"
                    placeholder='e.g. fn main() { println!("Hello, World!"); }'
                    disabled={saving}
                  />
                </div>
              </div>
            </form>
          </motion.article>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
