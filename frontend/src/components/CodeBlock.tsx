interface CodeBlockProps {
  code: string;
  label?: string;
}

export function CodeBlock({ code, label = "Example" }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-transparent shadow-2xl shadow-black/35">
      <div className="flex items-center border-b border-white/10 bg-white/[0.04] px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          {label}
        </span>
      </div>
      <pre className="max-h-80 overflow-auto p-4 text-sm leading-6 text-slate-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
