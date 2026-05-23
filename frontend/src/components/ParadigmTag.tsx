import { getParadigmStyles } from "@/lib/palette";

interface ParadigmTagProps {
  label: string;
  compact?: boolean;
}

export function ParadigmTag({ label, compact = false }: ParadigmTagProps) {
  return (
    <span
      className={`inline-flex max-w-full items-center rounded-full border font-medium leading-none ${
        compact ? "px-2 py-1 text-[0.68rem]" : "px-3 py-1.5 text-xs"
      }`}
      style={getParadigmStyles(label)}
      title={label}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}
