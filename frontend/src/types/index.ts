export type LoadState = "idle" | "loading" | "ready" | "error";

export interface LanguageGraphNode {
  id: string;
  name: string;
  group: string;
  year: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number;
  fy?: number;
}

export interface LanguageGraphLink {
  source: string | LanguageGraphNode;
  target: string | LanguageGraphNode;
  type: string;
}

export interface GraphResponse {
  nodes: LanguageGraphNode[];
  links: LanguageGraphLink[];
}

export interface LanguageSummary {
  id: string;
  name: string;
  year: number;
  paradigms: string[];
}

export interface LanguageDetail extends LanguageSummary {
  releaseDate: string;
  website: string;
  creators: string[];
  description: string;
  codeSnippet: string;
  influences: string[];
  influenced: string[];
}

export interface GraphFilters {
  query: string;
  paradigm: string;
  era: string;
}
