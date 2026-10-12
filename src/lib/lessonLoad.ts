// Fetch + parse of one lesson fragment. Split from LessonView so the view
// stays about rendering; this file owns every way a load can end.
//
//   200 with a lesson fragment          → ready
//   404                                 → missing ("being written" panel)
//   200 with the APP SHELL (index.html) → missing
//   redirected to /login                → full-page navigation to sign in
//   network error                       → error
import type { LessonData } from '../types';

export type Load =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'missing' }
  | { status: 'ready'; key: string; html: string; data: LessonData };

// The Vite dev server answers a request for a MISSING .html file with
// index.html and status 200 (its SPA fallback). Injecting that would nest the
// whole app inside the lesson column, so a body carrying the app's mount
// point counts as missing. Lesson fragments never contain it.
const APP_SHELL_MARKER = '<div id="root">';

// Known limitation: a lesson whose JSON is malformed renders without its
// worksheet, quiz and simulators instead of failing the whole page — the
// prose is still worth showing and the authoring error is in the console.
function parseLessonData(html: string): LessonData {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const raw = doc.getElementById('lesson-data')?.textContent;
  if (!raw) return {};
  try {
    return JSON.parse(raw) as LessonData;
  } catch (e) {
    console.error('[LESSON] parse FAILED (lesson-data) — worksheet, quiz and simulators skipped', e);
    return {};
  }
}

export async function fetchLesson(key: string, path: string, signal: AbortSignal): Promise<Load> {
  try {
    const res = await fetch(path, { cache: 'no-store', signal });
    // A session that expired while the page was open is redirected to the
    // login page by the middleware — send the learner there, not a blank lesson.
    if (res.redirected && new URL(res.url).pathname.startsWith('/login')) {
      location.href = '/login';
      return { status: 'loading' };
    }
    if (res.status === 404) return { status: 'missing' };
    if (!res.ok) return { status: 'error' };
    const html = await res.text();
    if (html.includes(APP_SHELL_MARKER)) return { status: 'missing' };
    return { status: 'ready', key, html, data: parseLessonData(html) };
  } catch {
    // An aborted fetch is the previous lesson being superseded, not a failure.
    return signal.aborted ? { status: 'loading' } : { status: 'error' };
  }
}
