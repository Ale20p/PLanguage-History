interface CodeBlockProps {
  code: string;
  label?: string;
}

export function CodeBlock({ code, label = "Example" }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-transparent shadow-2xl shadow-black/35">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          {label}
        </span>
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
        </div>
      </div>
      <pre className="max-h-80 overflow-auto p-4 text-sm leading-6 text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
