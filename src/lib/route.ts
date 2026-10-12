// Hash routing for the portal shell. No router dependency: the portal has
// three kinds of page (home, a lesson, the playground) and the sign-in
// middleware serves index.html for every path, so the hash is the only part
// of the URL the app owns. Back/forward work because the browser fires
// `hashchange` for them and the hook re-reads the hash on every event.
//
//   '' | '#' | '#home'          → home (course picker)
//   '#playground'               → SQL Playground
//   '#<courseId>/<lessonId>'    → that lesson, if both exist
//   '#1-1' … '#4-3'             → Snowflake Fundamentals lesson (legacy bookmarks)
//   anything else               → home
import { useMemo, useSyncExternalStore } from 'react';
import { DEFAULT_COURSE, findCourse, findLesson } from '../courses';

export type Route =
  | { kind: 'home' }
  | { kind: 'playground' }
  | { kind: 'lesson'; courseId: string; id: string };

export const HOME_HASH = '#home';
export const PLAYGROUND_HASH = '#playground';

// An unknown hash lands on Home rather than a 404 — a stale bookmark to a
// renamed lesson should still open the portal, and Home shows every course.
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '');
  if (path === '' || path === 'home') return { kind: 'home' };
  if (path === 'playground') return { kind: 'playground' };

  const slash = path.indexOf('/');
  if (slash > 0) {
    const course = findCourse(path.slice(0, slash));
    const id = path.slice(slash + 1);
    if (course && findLesson(course, id)) return { kind: 'lesson', courseId: course.id, id };
    return { kind: 'home' };
  }
  // Legacy: before the portal had several courses, '#1-1' WAS the lesson
  // link. Dropping this would send every old bookmark and every footer link
  // inside the Fundamentals lesson files to Home.
  if (findLesson(DEFAULT_COURSE, path)) return { kind: 'lesson', courseId: DEFAULT_COURSE.id, id: path };
  return { kind: 'home' };
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
