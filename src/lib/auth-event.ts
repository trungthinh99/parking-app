/**
 * Simple event emitter for auth-related events
 * Used to decouple API client from navigation (avoids circular dependencies)
 */

type AuthEventListener = () => void;

const listeners: AuthEventListener[] = [];

/** Subscribe to forced-logout events (token expired / invalid) */
export function onAuthExpired(listener: AuthEventListener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx !== -1) listeners.splice(idx, 1);
  };
}

/** Emit a forced-logout event */
export function emitAuthExpired(): void {
  listeners.forEach((fn) => fn());
}
