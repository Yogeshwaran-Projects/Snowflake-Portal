// Hash routing for the course shell. No router dependency: the portal has
// exactly two kinds of page (a lesson, the playground) and the sign-in
// middleware serves index.html for every path, so the hash is the only part
// of the URL the app owns. Back/forward work because the browser fires
// `hashchange` for them and the hook re-reads the hash on every event.
import { useMemo, useSyncExternalStore } from 'react';
import { ALL_LESSONS } from '../course';

export type Route = { kind: 'lesson'; id: string } | { kind: 'playground' };

export const PLAYGROUND_HASH = '#playground';

// An unknown or empty hash lands on the first lesson rather than a 404 —
// a stale bookmark to a renamed lesson should still open the course.
export function parseHash(hash: string): Route {
  const id = hash.replace(/^#/, '');
  if (id === 'playground') return { kind: 'playground' };
  if (ALL_LESSONS.some(l => l.id === id)) return { kind: 'lesson', id };
  const first = ALL_LESSONS[0];
  if (!first) throw new Error('route: course has no lessons');
  return { kind: 'lesson', id: first.id };
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

// The snapshot MUST be a primitive: useSyncExternalStore compares snapshots
// with Object.is and a fresh object per call would re-render forever.
function readHash() {
  return location.hash;
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribeToHash, readHash);
  return useMemo(() => parseHash(hash), [hash]);
}
