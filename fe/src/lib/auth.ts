// Authentication module: manages JWT token in localStorage and provides
// a reactive hook (useAuth) so components re-render on login/logout.
//
// Uses useSyncExternalStore (React 18+) to subscribe to localStorage changes
// without needing Context or a state management library.

import { useSyncExternalStore } from "react";
import { API_BASE_URL } from "./api";
import { DRAFT_ROOM_ID } from "./runtimeConfig";

export const TOKEN_KEY = "ppadun_token";

// On logout, we also reset the draft state on the backend.
const DRAFT_RESET_PATH = `/api/draft/picks?roomId=${encodeURIComponent(DRAFT_ROOM_ID)}`;
const DRAFT_RESET_URL = API_BASE_URL ? `${API_BASE_URL}${DRAFT_RESET_PATH}` : DRAFT_RESET_PATH;

// Check if user is currently authenticated by looking for the token.
export function isAuthed(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

// --- Reactive auth store using the pub/sub pattern ---
// Components subscribe via useAuth(); when login/logout calls emit(),
// all subscribers are notified and re-render.
type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

// Also handles cross-tab sync: if another tab logs in/out, this tab updates too.
function onStorage(e: StorageEvent) {
  if (e.key === TOKEN_KEY) emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);

  if (listeners.size === 1) {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorage);
    }
  };
}

// React hook: returns true/false and auto-updates when auth state changes.
export function useAuth(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isAuthed(),     // Client snapshot
    () => false           // Server snapshot (SSR fallback)
  );
}

// Store token and notify all subscribers.
export function login(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  emit();
}

// Remove token, reset draft state on backend, and notify subscribers.
export function logout(): void {
  void fetch(DRAFT_RESET_URL, { method: "DELETE" }).catch(() => {
    // Ignore reset failures — clearing token takes priority.
  });
  localStorage.removeItem(TOKEN_KEY);
  emit();
}
