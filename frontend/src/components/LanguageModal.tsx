"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useEffect } from "react";
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
            className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-slate-200"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function LanguageModal() {
  const { closeLanguage, detailStatus, selectedLanguage } = useGraph();
  const isOpen = selectedLanguage !== null || detailStatus === "loading";

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLanguage();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closeLanguage, isOpen]);

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeLanguage}
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
                <div className="glass-panel px-5 py-4 text-sm text-slate-200">
                  Loading language details...
                </div>
              </div>
            ) : null}

            {detailStatus === "error" ? (
              <div className="col-span-full flex min-h-80 flex-col items-center justify-center gap-4 p-8 text-center">
                <p className="text-lg font-semibold text-white">
                  Language details could not be loaded.
                </p>
                <button type="button" className="liquid-button" onClick={closeLanguage}>
                  Close
                </button>
              </div>
            ) : null}

            {selectedLanguage ? (
              <>
                <aside className="border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm text-cyan-200/75">
                        Released {selectedLanguage.year}
                      </p>
                      <h2 className="mt-1 text-3xl font-semibold text-white">
                        {selectedLanguage.name}
                      </h2>
                    </div>
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

                  <dl className="space-y-5 text-sm">
                    <div>
                      <dt className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Release Date
                      </dt>
                      <dd className="text-slate-100">
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
                          className="text-sm font-medium text-cyan-200 underline decoration-cyan-200/30 underline-offset-4 transition hover:text-white"
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
                      <p className="text-sm leading-7 text-slate-200">
                        {selectedLanguage.description}
                      </p>
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
