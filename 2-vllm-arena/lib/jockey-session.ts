/**
 * In-memory Jockey session id for the current page visit.
 * Clears automatically on full page reload (module re-initializes).
 */
let sessionId: string | null = null;

export function getJockeySessionId(): string | null {
  return sessionId;
}

export function setJockeySessionId(id: string): void {
  sessionId = id;
}

export function clearJockeySessionId(): void {
  sessionId = null;
}
