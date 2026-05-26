interface CodeBlockProps {
  code: string;
  label?: string;
}

export function CodeBlock({ code, label = "Example" }: CodeBlockProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-black/10 bg-transparent shadow-2xl shadow-black/5">
      <div className="flex items-center border-b border-black/10 bg-white/30 px-4 py-2">
        <span className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
          {label}
        </span>
      </div>
      <pre className="max-h-80 overflow-auto p-4 text-sm leading-6 text-slate-700">
        <code>{code}</code>
      </pre>
    </div>
  );
}
