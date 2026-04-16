// API utility layer: thin wrappers around fetch for GET, POST, DELETE.
// All API calls go through these helpers so we get consistent error handling
// and automatic query-string building in one place.

// Base URL comes from env var; defaults to relative path (works with Vite proxy in dev).
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");

type QueryValue = string | number | boolean | null | undefined;

// Constructs a full URL with query params, skipping null/undefined values.
function buildUrl(path: string, params?: Record<string, QueryValue>) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const base = API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
  if (!params) return base;

  const query = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(params)) {
    if (rawValue === null || rawValue === undefined || rawValue === "") continue;
    query.set(key, String(rawValue));
  }

  const queryString = query.toString();
  return queryString ? `${base}?${queryString}` : base;
}

// Core fetch wrapper: sends request, checks HTTP status, parses JSON.
// Throws on non-2xx responses with the server's error message.
async function requestJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

// GET request — accepts optional query params and AbortSignal for cancellation.
export function apiGet<T>(
  path: string,
  params?: Record<string, QueryValue>,
  signal?: AbortSignal
) {
  return requestJson<T>(buildUrl(path, params), { signal });
}

// POST request — sends JSON body with optional query params.
export function apiPost<TResponse, TBody>(
  path: string,
  body: TBody,
  params?: Record<string, QueryValue>,
  signal?: AbortSignal
) {
  return requestJson<TResponse>(buildUrl(path, params), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

// DELETE request — used for removing draft picks, resetting state, etc.
export function apiDelete<T>(
  path: string,
  params?: Record<string, QueryValue>,
  signal?: AbortSignal
) {
  return requestJson<T>(buildUrl(path, params), {
    method: "DELETE",
    signal,
  });
}
