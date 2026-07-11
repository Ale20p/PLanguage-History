const DEFAULT_ACCENT = "#94A3B8";

export const PARADIGM_OPTIONS = [
  "Object-Oriented",
  "Functional",
  "Procedural",
  "Imperative",
  "Multi-Paradigm",
  "Systems",
  "Scripting",
  "Logic",
  "Concurrent",
  "Generic",
  "Frameworks -> Component-Based",
  "Frameworks -> MVC",
  "Frameworks -> Micro-Framework",
  "Libraries -> State Management",
  "Libraries -> Utility",
  "Libraries -> Testing",
] as const;

const PARADIGM_ACCENTS: Record<string, string> = {
  "object-oriented": "#10B981",
  functional: "#8B5CF6",
  procedural: "#3B82F6",
  imperative: "#3B82F6",
  "multi-paradigm": "#F59E0B",
  systems: "#EF4444",
  system: "#EF4444",
  scripting: "#06B6D4",
  logic: "#EC4899",
  concurrent: "#14B8A6",
  generic: "#F97316",
  "frameworks -> component-based": "#E11D48",
  "component-based": "#E11D48",
  "frameworks -> mvc": "#2563EB",
  "mvc": "#2563EB",
  "frameworks -> micro-framework": "#10B981",
  "micro-framework": "#10B981",
  "libraries -> state management": "#8B5CF6",
  "state management": "#8B5CF6",
  "libraries -> utility": "#D97706",
  "utility": "#D97706",
  "libraries -> testing": "#DB2777",
  "testing": "#DB2777",
  unknown: DEFAULT_ACCENT,
};

export function normalizeParadigm(paradigm: string | null | undefined) {
  return (paradigm ?? "Unknown").trim().toLowerCase();
}

export function getParadigmColor(paradigm: string | null | undefined) {
  return PARADIGM_ACCENTS[normalizeParadigm(paradigm)] ?? DEFAULT_ACCENT;
}

export function getParadigmTextColor(paradigm: string | null | undefined) {
  const color = getParadigmColor(paradigm);
  return `color-mix(in srgb, ${color} 82%, white)`;
}

export function getParadigmStyles(paradigm: string | null | undefined) {
  const color = getParadigmColor(paradigm);

  return {
    color: getParadigmTextColor(paradigm),
    backgroundColor: `color-mix(in srgb, ${color} 14%, transparent)`,
    borderColor: `color-mix(in srgb, ${color} 44%, transparent)`,
    boxShadow: `0 0 22px color-mix(in srgb, ${color} 18%, transparent)`,
  };
}

export function readableConnectionType(type: string) {
  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
