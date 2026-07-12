"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useEffect, useState } from "react";
import { marked } from "marked";
import { useGraph } from "@/context/GraphContext";
import { CodeBlock } from "@/components/CodeBlock";
import { ParadigmTag } from "@/components/ParadigmTag";

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

function formatReleaseDate(releaseDate: string) {
  const parsed = new Date(`${releaseDate}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return releaseDate;
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function DetailList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-black/10 bg-white/20 px-3 py-1 text-xs text-slate-700"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LanguageModal() {
  const { closeLanguage, detailStatus, selectedLanguage, updateLanguage, graph } = useGraph();
  const isOpen = selectedLanguage !== null || detailStatus === "loading";

  const [isEditing, setIsEditing] = useState(false);
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

  const availableLanguages = [...graph.nodes].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    if (selectedLanguage) {
      setName(selectedLanguage.name);
      setReleaseDate(selectedLanguage.releaseDate || "");
      setWebsite(selectedLanguage.website || "");
      setDescription(selectedLanguage.description || "");
      setCodeSnippet(selectedLanguage.codeSnippet || "");
      setParadigmsText(selectedLanguage.paradigms.join(", "));
      setCreatorsText(selectedLanguage.creators.join(", "));
      setInfluencesText(selectedLanguage.influences.join(", "));
      setInfluencedText(selectedLanguage.influenced.join(", "));
      setIsEditing(false);
      setSaveError(null);
    }
  }, [selectedLanguage]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) {
        closeLanguage();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeLanguage, isOpen, saving]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedLanguage) {
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
      await updateLanguage(selectedLanguage.id, {
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
      setIsEditing(false);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Failed to save language details."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/30 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={saving ? undefined : closeLanguage}
        >
          <motion.article
            className="glass-modal grid max-h-[88vh] w-full max-w-5xl overflow-hidden lg:grid-cols-[0.42fr_0.58fr]"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(event) => event.stopPropagation()}
          >
            {detailStatus === "loading" ? (
              <div className="col-span-full flex min-h-80 items-center justify-center p-8">
                <div className="glass-panel px-5 py-4 text-sm text-slate-700">
                  Loading language details...
                </div>
              </div>
            ) : null}

            {detailStatus === "error" ? (
              <div className="col-span-full flex min-h-80 flex-col items-center justify-center gap-4 p-8 text-center">
                <p className="text-lg font-semibold text-slate-800">
                  Language details could not be loaded.
                </p>
                <button type="button" className="liquid-button" onClick={closeLanguage}>
                  Close
                </button>
              </div>
            ) : null}

            {selectedLanguage && isEditing ? (
              <form onSubmit={handleSave} className="col-span-full flex flex-col min-h-0 overflow-y-auto p-6 max-h-[88vh]">
                <div className="mb-6 flex items-center justify-between border-b border-black/10 pb-4">
                  <h2 className="text-2xl font-semibold text-slate-800">
                    Edit {selectedLanguage.name}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="liquid-button border-slate-300 hover:border-slate-400 bg-slate-100/60 hover:bg-slate-200/80 !h-9 !py-0 !px-3 !min-h-0 font-medium"
                      disabled={saving}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="liquid-button border-cyan-600 bg-cyan-600 hover:bg-cyan-700 text-white font-medium shadow-cyan-600/10 shadow-lg !h-9 !py-0 !px-4 !min-h-0"
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save"}
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
                    <label htmlFor="edit-name" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                      Language Name *
                    </label>
                    <input
                      id="edit-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 rounded-xl border border-black/10 bg-white/25 px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20"
                      placeholder="e.g. Python"
                      disabled={saving}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-release-date" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                      Release Date *
                    </label>
                    <input
                      id="edit-release-date"
                      type="date"
                      required
                      value={releaseDate}
                      onChange={(e) => setReleaseDate(e.target.value)}
                      className="h-11 rounded-xl border border-black/10 bg-white/25 px-4 text-sm text-slate-800 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20"
                      disabled={saving}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="edit-website" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                      Website URL
                    </label>
                    <input
                      id="edit-website"
                      type="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="h-11 rounded-xl border border-black/10 bg-white/25 px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20"
                      placeholder="e.g. https://www.python.org"
                      disabled={saving}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-paradigms" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                      Paradigms (comma separated)
                    </label>
                    <input
                      id="edit-paradigms"
                      type="text"
                      value={paradigmsText}
                      onChange={(e) => setParadigmsText(e.target.value)}
                      className="h-11 rounded-xl border border-black/10 bg-white/25 px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20"
                      placeholder="e.g. Multi-paradigm, Object-oriented, Functional"
                      disabled={saving}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="edit-creators" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                      Creators (comma separated)
                    </label>
                    <input
                      id="edit-creators"
                      type="text"
                      value={creatorsText}
                      onChange={(e) => setCreatorsText(e.target.value)}
                      className="h-11 rounded-xl border border-black/10 bg-white/25 px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20"
                      placeholder="e.g. Guido van Rossum"
                      disabled={saving}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="edit-influences" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                        Influenced By (comma separated)
                      </label>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            handleAddInfluence(val);
                            e.target.value = "";
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
                      id="edit-influences"
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
                      <label htmlFor="edit-influenced" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                        Influenced (comma separated)
                      </label>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val) {
                            handleAddInfluenced(val);
                            e.target.value = "";
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
                      id="edit-influenced"
                      type="text"
                      value={influencedText}
                      onChange={(e) => setInfluencedText(e.target.value)}
                      className="h-11 rounded-xl border border-black/10 bg-white/25 px-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20"
                      placeholder="e.g. Swift"
                      disabled={saving}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="edit-description" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                      Description *
                    </label>
                    <textarea
                      id="edit-description"
                      required
                      rows={4}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="rounded-xl border border-black/10 bg-white/25 p-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20 resize-y custom-scrollbar"
                      placeholder="Provide background context and features of the language..."
                      disabled={saving}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <label htmlFor="edit-code" className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 font-sans">
                      Code Snippet
                    </label>
                    <textarea
                      id="edit-code"
                      rows={6}
                      value={codeSnippet}
                      onChange={(e) => setCodeSnippet(e.target.value)}
                      className="rounded-xl border border-black/10 bg-white/25 p-4 font-mono text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-cyan-600/60 focus:bg-white/[0.45] focus:ring-2 focus:ring-cyan-600/20 resize-y custom-scrollbar"
                      placeholder='e.g. print("Hello, World!")'
                      disabled={saving}
                    />
                  </div>
                </div>
              </form>
            ) : selectedLanguage ? (
              <>
                <aside className="border-b border-black/10 p-6 lg:border-b-0 lg:border-r">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-cyan-700/75">
                        Released {selectedLanguage.year}
                      </p>
                      <h2 className="mt-1 text-3xl font-semibold text-slate-800">
                        {selectedLanguage.name}
                      </h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        className="liquid-button border-cyan-600/20 bg-cyan-50/40 text-cyan-800 hover:bg-cyan-100/50 !h-[2.35rem] !py-0 !px-3 !min-h-0 flex items-center gap-1.5 text-xs font-medium"
                        title="Edit Language details"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125"></path>
                        </svg>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={closeLanguage}
                        aria-label="Close language details"
                        title="Close"
                      >
                        x
                      </button>
                    </div>
                  </div>

                  <dl className="space-y-5 text-sm">
                    <div>
                      <dt className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Release Date
                      </dt>
                      <dd className="text-slate-700">
                        {formatReleaseDate(selectedLanguage.releaseDate)}
                      </dd>
                    </div>
                    <div>
                      <dt className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Paradigms
                      </dt>
                      <dd className="flex flex-wrap gap-2">
                        {selectedLanguage.paradigms.map((paradigm) => (
                          <ParadigmTag key={paradigm} label={paradigm} />
                        ))}
                      </dd>
                    </div>
                    <DetailList title="Creators" items={selectedLanguage.creators} />
                    <div>
                      <dt className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Reference
                      </dt>
                      <dd>
                        <a
                          href={selectedLanguage.website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-cyan-700 underline decoration-cyan-700/30 underline-offset-4 transition hover:text-cyan-900"
                        >
                          Official website
                        </a>
                      </dd>
                    </div>
                  </dl>
                </aside>

                <div className="min-h-0 overflow-y-auto p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Background
                      </h3>
                      <div
                        className="max-h-[320px] overflow-y-auto pr-2 text-sm leading-7 text-slate-700 custom-scrollbar markdown-content"
                        dangerouslySetInnerHTML={{ __html: marked.parse(selectedLanguage.description) as string }}
                      />
                    </div>

                    <CodeBlock
                      code={selectedLanguage.codeSnippet}
                      label={`${selectedLanguage.name} snippet`}
                    />

                    <div className="grid gap-5 md:grid-cols-2">
                      <DetailList
                        title="Influenced By"
                        items={selectedLanguage.influences}
                      />
                      <DetailList
                        title="Influenced"
                        items={selectedLanguage.influenced}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </motion.article>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
