import type {
  GraphFilters,
  GraphResponse,
  LanguageDetail,
  LanguageSummary,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError("NEXT_PUBLIC_API_BASE_URL is not configured.", 0);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    throw new ApiError(
      error instanceof Error ? error.message : "Network request failed.",
      0,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      `Request to ${path} failed with status ${response.status}`,
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export function getGraph() {
  return request<GraphResponse>("/graph");
}

export function getLanguageDetail(id: string) {
  return request<LanguageDetail>(`/languages/${encodeURIComponent(id)}`);
}

export function searchLanguages(filters: GraphFilters) {
  const params = new URLSearchParams();

  if (filters.query.trim()) {
    params.set("q", filters.query.trim());
  }

  if (filters.paradigm) {
    params.set("paradigm", filters.paradigm);
  }

  if (filters.era) {
    params.set("era", filters.era);
  }

  const query = params.toString();

  return request<LanguageSummary[]>(`/languages/search${query ? `?${query}` : ""}`);
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function updateLanguage(id: string, data: Partial<LanguageDetail>) {
  return request<LanguageDetail>(`/languages/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
