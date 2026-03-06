import { useSyncExternalStore } from "react";

export const TOKEN_KEY = "ppadun_token";

/** Read current auth state */
export function isAuthed(): boolean {
  return Boolean(localStorage.getItem(TOKEN_KEY));
}

/** --- Reactive auth store --- */
type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l();
}

function onStorage(e: StorageEvent) {
  if (e.key === TOKEN_KEY) emit();
}

function subscribe(listener: Listener) {
  listeners.add(listener);

  // Attach storage listener once the first subscriber exists
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

/** Hook: components re-render when auth changes */
export function useAuth(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => isAuthed(),
    () => false
  );
}

/** Mutations */
export function mockLogin(): void {
  localStorage.setItem(TOKEN_KEY, "mock-token");
  emit(); // ✅ notify same-tab subscribers
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  emit(); // ✅ notify same-tab subscribers
}
// Will be substitute into login API call in the future